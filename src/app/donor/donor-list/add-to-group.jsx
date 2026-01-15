import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import BASE_URL from '@/config/base-url';
import { ArrowLeft, ArrowUpDown, ChevronDown, Loader2, Search, SquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AddToGroup = ({ id, closegroupModal, page, isOpen }) => {
  const token = Cookies.get('token');
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [loadingId,setLoadingId] = useState(null)

  const { data: donorData = [], isLoading } = useQuery({
    queryKey: ['donor-active'],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/api/donor-active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data.map(donor => ({
        name: donor.indicomp_full_name,
        phone: donor.indicomp_mobile_phone,
        id: donor.indicomp_related_id,
      }));
    },
    retry: 2,
    staleTime: 30 * 60 * 1000,
   cacheTime: 60 * 60 * 1000,
   refetchOnMount: false,
   refetchOnWindowFocus: false,
   refetchOnReconnect: false,
   enabled: isOpen,
  });

  const addMemberToGroup = async (relativeId) => {
    setLoadingId(relativeId)
    try {
      await axios({
        url: `${BASE_URL}/api/update-donor-addtogroup/${id}`,
        method: 'PATCH',
        data: { indicomp_related_id: relativeId },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Successfully added to group');
      closegroupModal();
      switch (page) {
        case 'indivisual':
          queryClient.invalidateQueries(['donor', id]);
          break;
        case 'company':
          queryClient.invalidateQueries(['promoter-active', id]);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error adding member to group:', error);
      toast.error('Failed to add member to group');
    }finally {
      setLoadingId(null);
    }
  };

  const columns = [
    {
      id: "S. No.",
      header: "S. No.",
      cell: ({ row }) => {
        const globalIndex = row.index + 1;
        return <div className="text-xs font-medium">{globalIndex}</div>;
      },
      size: 60,
    },
    {
      accessorKey: "name",
    
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[13px] font-medium">{row.getValue("name")}</div>
      ),
      size: 150,
    },
    {
      accessorKey: "phone",
  
      header: "Phone",
      cell: ({ row }) => (
        <div className="text-xs font-medium">{row.getValue("phone")}</div>
      ),
      size: 120,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const isLoading = loadingId === row.original.id;
        return (
          <div className="flex flex-row">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isLoading}
                    onClick={() => addMemberToGroup(row.original.id)}
                  >
                   {isLoading ?(
                    <Loader2 className='h-4 w-4 animate-spin text-primary '/>
                   ):(
                    <SquarePlus className="h-4 w-4" />
                   )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLoading ? "Adding...":"Add to Group"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: donorData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const TableShimmer = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {table.getVisibleFlatColumns().map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={closegroupModal}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeft 
              onClick={closegroupModal}
              className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
            />
            Add to Group
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-1">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search donors..."
              value={table.getState().globalFilter || ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
            />
          </div>
          <div className="flex flex-col md:flex-row md:ml-auto gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Columns <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="text-xs capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-none border flex flex-col">
          <Table className="flex-1">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-10 px-3 bg-[var(--team-color)] text-[var(--label-color)] text-sm font-medium"
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading && !table.getRowModel().rows.length ? (
                <TableShimmer />
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="h-2 hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-12">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-sm"
                  >
                    No donors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-1">
          <div className="flex-1 text-sm text-muted-foreground">
            Total Donors: &nbsp;
            {table.getFilteredRowModel().rows.length}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToGroup;