import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check, X, Shield, Users, Clock, Trash2, UserPlus } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
  role?: string;
}

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  // Create admin dialog state
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch roles for each user
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles.map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) || 'user'
      })) as UserProfile[];
    }
  });

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminName) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newAdminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsCreatingAdmin(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
        options: {
          data: {
            full_name: newAdminName
          }
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');
      
      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role: 'admin' });
      
      if (roleError) throw roleError;
      
      // Approve the admin user
      const { error: approveError } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', authData.user.id);
      
      if (approveError) throw approveError;
      
      toast.success('Admin account created successfully!');
      setCreateAdminOpen(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const approveMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: approved })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onMutate: async ({ userId, approved }) => {
      // Optimistic UI update so the row disappears immediately
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });
      const previous = queryClient.getQueryData<UserProfile[]>(['admin-users']);
      if (previous) {
        queryClient.setQueryData<UserProfile[]>(['admin-users'],
          previous.map((p) => (p.user_id === userId ? { ...p, is_approved: approved } : p))
        );
      }
      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin-users'], context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: (_data, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(approved ? 'User approved successfully' : 'User access revoked');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isAdmin ? 'Admin role removed' : 'Admin role granted');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user roles first
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // Delete profile
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => toast.error(error.message)
  });

  // Admins don't need approval - exclude them from pending list
  const pendingUsers = users?.filter(u => !u.is_approved && u.role !== 'admin') || [];
  const approvedUsers = users?.filter(u => u.is_approved || u.role === 'admin') || [];

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const isSelf = (userId: string) => currentUser?.id === userId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Approve users and manage admin access</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Create a new administrator account. They can log in at /admin-login.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    placeholder="Admin Name"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateAdminOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAdmin} 
                  disabled={isCreatingAdmin}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
            Admin login: <a href="/admin-login" className="text-primary hover:underline">/admin-login</a>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingUsers.length})
            </CardTitle>
            <CardDescription>Users waiting for account approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate({ userId: user.user_id, approved: true })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {user.full_name || user.email}'s profile. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteUserMutation.mutate(user.user_id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({approvedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {user.full_name || 'No name'}
                        {isSelf(user.user_id) && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <><Shield className="h-3 w-3 mr-1" /> Admin</>
                      ) : (
                        'User'
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Toggle admin - disable for self */}
                      <Button 
                        size="sm" 
                        variant={user.role === 'admin' ? 'destructive' : 'outline'}
                        disabled={isSelf(user.user_id)}
                        onClick={() => toggleAdminMutation.mutate({ 
                          userId: user.user_id, 
                          isAdmin: user.role === 'admin' 
                        })}
                        title={isSelf(user.user_id) ? "You cannot change your own admin role" : ""}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                      
                      {/* Delete user - disable for self */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={isSelf(user.user_id)}
                            title={isSelf(user.user_id) ? "You cannot delete your own account" : ""}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {user.full_name || user.email}'s profile. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteUserMutation.mutate(user.user_id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {approvedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No approved users yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
