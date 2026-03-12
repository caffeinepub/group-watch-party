import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import { UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { useGetAllUsers, useRemoveUser } from "../hooks/useQueries";

export default function UsersTab() {
  const { data: users = [], isLoading } = useGetAllUsers();
  const { mutateAsync: removeUser } = useRemoveUser();

  const handleRemove = async (principal: Principal) => {
    try {
      await removeUser(principal);
      toast.success("User removed");
    } catch {
      toast.error("Failed to remove user");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg text-foreground">
          Users
        </h2>
        <p className="text-sm text-muted-foreground">
          {users.length} registered users
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3" data-ocid="users.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-40 text-center"
            data-ocid="users.empty_state"
          >
            <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="font-display font-semibold text-foreground mb-1">
              No users yet
            </p>
            <p className="text-sm text-muted-foreground">
              Users will appear here once they join.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">
                  Display Name
                </TableHead>
                <TableHead className="text-muted-foreground text-xs">
                  Principal
                </TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, i) => (
                <TableRow
                  key={user.principal.toString()}
                  data-ocid={`users.item.${i + 1}`}
                  className="border-border hover:bg-muted/30"
                >
                  <TableCell className="font-medium text-sm text-foreground py-3">
                    {user.displayName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono py-3">
                    {user.principal.toString().slice(0, 20)}…
                  </TableCell>
                  <TableCell className="py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(user.principal)}
                      data-ocid={`users.remove_button.${i + 1}`}
                      className="w-8 h-8 text-destructive hover:bg-destructive/10"
                      title="Remove user"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
