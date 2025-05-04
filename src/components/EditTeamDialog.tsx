
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Team } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';
import { Pencil } from 'lucide-react';

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  users: User[];
  teamLeads: User[];
  employees: User[];
  onSave: (team: Team) => void;
}

export function EditTeamDialog({ 
  open, 
  onOpenChange,
  team,
  users,
  teamLeads,
  employees,
  onSave
}: EditTeamDialogProps) {
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  
  // Initialize form with team data
  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setSelectedLeadId(team.leadId || null);
      setSelectedMemberIds(team.memberIds || []);
    }
  }, [team]);

  const handleSave = () => {
    if (!teamName) {
      toast({
        title: "Missing information",
        description: "Please provide a team name",
        variant: "destructive"
      });
      return;
    }

    const updatedTeam: Team = {
      ...team,
      name: teamName,
      leadId: selectedLeadId || null,
      memberIds: selectedMemberIds || []
    };
    
    console.log('Saving team with data:', updatedTeam);
    onSave(updatedTeam);
  };
  
  const handleMemberToggle = (userId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Pencil className="mr-2 h-5 w-5" />
            Edit Team
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
          
          <div className="grid gap-2">
            <Label>Team Lead</Label>
            <Select 
              value={selectedLeadId || "none"} 
              onValueChange={(value) => setSelectedLeadId(value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!teamName}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
