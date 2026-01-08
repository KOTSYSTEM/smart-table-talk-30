import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type MenuItem = Tables<'menu_items'>;
export type MenuItemInsert = TablesInsert<'menu_items'>;
export type MenuItemUpdate = TablesUpdate<'menu_items'>;
export type MenuItemVariant = Tables<'menu_item_variants'>;
export type MenuItemAddon = Tables<'menu_item_addons'>;

export interface MenuItemWithRelations extends MenuItem {
  category: Tables<'categories'> | null;
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
}

export function useMenuItems(categoryId?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ['menu_items', categoryId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(*),
          variants:menu_item_variants(*),
          addons:menu_item_addons(*)
        `)
        .order('name');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as MenuItemWithRelations[];
    },
  });
}

export function useMenuItem(id: string) {
  return useQuery({
    queryKey: ['menu_items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(*),
          variants:menu_item_variants(*),
          addons:menu_item_addons(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as MenuItemWithRelations;
    },
    enabled: !!id,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: MenuItemInsert) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: MenuItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ is_available })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    },
  });
}
