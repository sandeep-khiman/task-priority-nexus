
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users } from 'lucide-react';
import { User, Team, CreateTeamPayload, UserRole } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';

interface CreateTeamDialogProps {
  users: User[];
  teamLeads: User[];
  managers: User[];
  onCreateTeam: (team: CreateTeamPayload) => void;
}

export function CreateTeamDialog({ users, teamLeads, managers, onCreateTeam }: CreateTeamDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Filter employees only
  const employees = users.filter(user => user.role === 'employee');

  useEffect(() => {
    // Reset selections when dialog opens/closes
    if (!open) {
      setTeamName('');
      setSelectedManagerId('');
      setSelectedLeadId('');
      setSelectedMemberIds([]);
    }
  }, [open]);

  const handleCreateTeam = () => {
    if (!teamName || !selectedManagerId || !selectedLeadId) {
      toast({
        title: "Missing information",
        description: "Please provide a team name, select a manager and a team lead",
        variant: "destructive"
      });
      return;
    }

    const newTeam: CreateTeamPayload = {
      name: teamName,
      managerId: selectedManagerId,
      leadId: selectedLeadId,
      memberIds: selectedMemberIds
    };

    onCreateTeam(newTeam);
    
    // Reset form
    setTeamName('');
    setSelectedManagerId('');
    setSelectedLeadId('');
    setSelectedMemberIds([]);
    setOpen(false);
    
    toast({
      title: "Team created",
      description: `Team "${teamName}" has been created successfully`
    });
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
          <DialogTitle>Create New Team</DialogTitle>
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
          
          <div className="grid gap-2">
            <Label>Team Lead</Label>
            <Select 
              value={selectedLeadId} 
              onValueChange={setSelectedLeadId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team lead" />
              </SelectTrigger>
              <SelectContent>
                {teamLeads.map((lead) => (
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateTeam} 
            disabled={!teamName || !selectedManagerId || !selectedLeadId}
          >
            Create Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
