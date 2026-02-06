import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCalculation } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCalculations() {
  return useQuery({
    queryKey: [api.calculations.list.path],
    queryFn: async () => {
      const res = await fetch(api.calculations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch saved calculations");
      return api.calculations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCalculation(id: number) {
  return useQuery({
    queryKey: [api.calculations.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.calculations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch calculation");
      return api.calculations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateCalculation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCalculation) => {
      const res = await fetch(api.calculations.create.path, {
        method: api.calculations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.calculations.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to save calculation");
      }
      return api.calculations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.calculations.list.path] });
      toast({
        title: "Success",
        description: "Calculation saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCalculation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.calculations.delete.path, { id });
      const res = await fetch(url, { 
        method: api.calculations.delete.method, 
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to delete calculation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.calculations.list.path] });
      toast({
        title: "Deleted",
        description: "Calculation removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
