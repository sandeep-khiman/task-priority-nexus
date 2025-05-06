
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users } from 'lucide-react';
import { User, Team, CreateTeamPayload, UserRole } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreateTeamDialogProps {
  users: User[];
  teamLeads: User[];
  managers: User[];
  onCreateTeam: (team: CreateTeamPayload) => void;
}

export function CreateTeamDialog({ users, teamLeads, managers, onCreateTeam }: CreateTeamDialogProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filter employees only
  const employees = users.filter(user => (user.role === 'employee' && user.managerId==selectedManagerId ) );

  // Set manager automatically if current user is a manager
  useEffect(() => {
    if (profile?.role === 'manager' && !selectedManagerId) {
      setSelectedManagerId(profile.id);
      console.log(profile.id);
      
    }
  }, [profile, selectedManagerId]);

  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTeamName('');
      if (profile?.role !== 'manager') {
        setSelectedManagerId('');
      }
      setSelectedLeadId(null);
      setSelectedMemberIds([]);
    }
  }, [open, profile]);

  const handleCreateTeam = async () => {
    if (!teamName || (!selectedManagerId && profile?.role !== 'manager')) {
      toast({
        title: "Missing information",
        description: "Please provide a team name and select a manager",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      const managerId = selectedManagerId || (profile?.id || '');
      console.log(managerId);
      
      // First create the team in the database
      const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .insert({
      name: teamName,
      manager_id: managerId,
    })
    .select('id')
    .single();
    console.log("----------------------------------------------",teamData);
if (teamError) {
  console.log("++++++++++++++++++++++++++++++++",teamError);
    console.error('Error inserting team:', teamError);
} else {
    console.log('Inserted team ID:', teamData.id);
}
      
      if (!teamData) {
        throw new Error('Failed to create team');
      }
      
      const newTeam: Team = {
        id: teamData.id,
        name: teamName,
        manager_id: managerId,
        memberIds: []
      };
      console.log(newTeam);
      
      // If there's a team lead, create a relation
      if (selectedLeadId) {
        const { error: leadError } = await supabase
          .from('team_members')
          .insert({
            team_id: newTeam.id,
            user_id: selectedLeadId,
            is_lead: true
          });
          
        if (leadError) {
          console.error('Error assigning team lead:', leadError);
          
        } else {
          newTeam.leadId = selectedLeadId;
        }
      }
      
      // Add team members
      if (selectedMemberIds.length > 0) {
        const memberInserts = selectedMemberIds.map(memberId => ({
          team_id: newTeam.id,
          user_id: memberId,
          is_lead: false
        }));
        
        const { error: membersError } = await supabase
          .from('team_members')
          .insert(memberInserts);
          
        if (membersError) {
          console.error('Error adding team members:', membersError);
        } else {
          newTeam.memberIds = selectedMemberIds;
        }
      }
      
      const newTeamPayload: CreateTeamPayload = {
        name: newTeam.name,
        managerId: newTeam.manager_id || '',
        leadId: newTeam.leadId,
        memberIds: newTeam.memberIds || []
      };
      
      console.log(newTeamPayload);
      
      // Call the onCreateTeam handler with the new team
      onCreateTeam(newTeamPayload);
      
      // Reset form and close dialog
      setTeamName('');
      if (profile?.role !== 'manager') {
        setSelectedManagerId('');
      }
      setSelectedLeadId(null);
      setSelectedMemberIds([]);
      setOpen(false);
      
      toast({
        title: "Team created",
        description: `Team "${teamName}" has been created successfully`
      });
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: "Team creation failed",
        description: error.message || "An error occurred while creating the team",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleMemberToggle = (userId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Create New Team
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input 
              id="team-name" 
              value={teamName} 
              onChange={(e) => setTeamName(e.target.value)} 
              placeholder="Enter team name..."
            />
          </div>
          
          {profile?.role !== 'manager' && (
            <div className="grid gap-2">
              <Label>Manager</Label>
              <Select 
                value={selectedManagerId} 
                onValueChange={setSelectedManagerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label>Team Lead (Optional)</Label>
            <Select 
              value={selectedLeadId || "none"}
              onValueChange={(value) => setSelectedLeadId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {teamLeads
  .filter(lead => lead.managerId === selectedManagerId)
  .map((lead) => (
    <SelectItem key={lead.id} value={lead.id}>
      {lead.name}
    </SelectItem>
))}

              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label>Team Members</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {employees.length > 0 ? (
                employees.map(employee => (
                  <div key={employee.id} className="flex items-center justify-between">
                    <span>{employee.name}</span>
                    <Button 
                      variant={selectedMemberIds.includes(employee.id) ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleMemberToggle(employee.id)}
                    >
                      {selectedMemberIds.includes(employee.id) ? "Selected" : "Select"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-center py-2">
                  No employees available to add
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTeam} 
            disabled={!teamName || isCreating}
          >
            {isCreating ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
