import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Loader2, Edit, Search, ChevronDown, ArrowUpDown } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { toast } from "sonner";
import BASE_URL from "@/config/base-url";


const EditPromoterPending = ({ name }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const queryClient = useQueryClient();
  const token = Cookies.get("token");
 
  const {
    data: donors = [],
    isLoading: donorsLoading,
    error: donorsError,
  } = useQuery({
    queryKey: ["activeDonors"],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/api/donor-active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data || []
    },
    enabled: !!token,
    retry: 2,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });


  const columns = [
    {
      id: "select",
      header: "Select",
      cell: ({ row }) => {
        const donor = row.original;
        const isSelected = selectedDonor?.id === donor.id;
        return (
          <div className="flex items-center justify-center">
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`h-6 w-6 p-0 ${isSelected ? "bg-green-600 hover:bg-green-700" : ""}`}
              onClick={() => handleSelectDonor(donor)}
            >
              {isSelected && (
                <Check className="h-4 w-4" />
              ) }
            </Button>
          </div>
        );
      },
      size: 80,
    },
    {
      accessorKey: "indicomp_fts_id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs font-medium"
        >
          ID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs font-semibold">{row.getValue("indicomp_fts_id")}</div>
      ),
      size: 80,
    },
    {
      accessorKey: "indicomp_full_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs font-medium"
        >
          Full Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm font-medium">{row.getValue("indicomp_full_name")}</div>
      ),
      size: 180,
    },
    {
      accessorKey: "chapter_name",
      header: "Chapter",
      cell: ({ row }) => (
        <div className="text-xs">{row.getValue("chapter_name")}</div>
      ),
      size: 120,
    },
    {
      accessorKey: "indicomp_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("indicomp_type");
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              type === "Individual"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {type}
          </span>
        );
      },
      size: 100,
    },
    
  ];

  const table = useReactTable({
    data: donors,
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
        pageSize: 10,
      },
    },
  });

  const handleSubmit = async () => {
    if (!selectedDonor) {
      toast.error("Please select a promoter from the table");
      return;
    }

    setIsLoading(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.post(
        `${BASE_URL}/api/pending-promoter`,
        {
          old_name: name,
          indicomp_fts_id: selectedDonor.indicomp_fts_id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data.code === 201 || response?.status === 200) {
        toast.success(response.data.message || "Promoter updated successfully");
        
      
        await queryClient.invalidateQueries(["pending-promoter"]);
        
        setOpen(false);
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to update promoter");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update promoter"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDonor = (donor) => {
    setSelectedDonor(donor);
  };

  const resetForm = () => {
    setSelectedDonor(null);
    table.reset();
    setGlobalFilter("");
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  
  const TableShimmer = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {table.getVisibleFlatColumns().map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pending Promoter: {name}</DialogTitle>
          <DialogDescription>
            Select a promoter from the table below to update {name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
         
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  Current Name: <span className="font-bold text-blue-700">{name}</span>
                </p>
                {selectedDonor && (
                  <p className="text-sm font-medium mt-1">
                    Selected: <span className="font-bold">{selectedDonor.indicomp_full_name}</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      ID: {selectedDonor.indicomp_fts_id}
                    </span>
                  </p>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedDonor}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Promoter"
                )}
              </Button>
            </div>
          </div>

       
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search promoters..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto">
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

      
          <div className="rounded-md border flex flex-col">
            <div className="overflow-auto max-h-[300px]">
              <Table className="flex-1">
                <TableHeader className="sticky top-0 bg-white z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-10 px-3 text-xs font-semibold"
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
                  {donorsLoading ? (
                    <TableShimmer />
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={selectedDonor?.id === row.original.id && "selected"}
                        className={`h-11 hover:bg-gray-50 ${
                          selectedDonor?.id === row.original.id ? "bg-blue-50" : ""
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-3 py-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-32 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm text-gray-500">
                            No promoters found
                          </p>
                          {donorsError && (
                            <p className="text-xs text-red-500">
                              Error loading data
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
            <div className="text-sm text-gray-600">
              Total Promoters:{" "}
              <span className="font-semibold">
                {table.getFilteredRowModel().rows.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8"
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPromoterPending;