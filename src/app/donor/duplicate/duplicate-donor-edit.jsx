import { fetchDuplicateEditById, fetchDuplicateEditByIdUpdate } from "@/api";
import { MemoizedSelect } from '@/components/common/memoized-select';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BASE_URL from "@/config/base-url";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import Cookies from "js-cookie";
import { AlertTriangle, ArrowLeft, ArrowUpDown, Loader2, Merge, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const DuplicateDonorEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
   const queryClient = useQueryClient();
  const [donor, setDonor] = useState({
    indicomp_fts_id: "",
    indicomp_full_name: "",
    indicomp_type: "",
    indicomp_com_contact_name: "",
    indicomp_spouse_name: "",
    indicomp_mobile_phone: "",
    indicomp_email: "",
    indicomp_donor_type: "",
    indicomp_related_id: "",
  });
  
  const [selectedDonorId, setSelectedDonorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  
  const { data: donorData, isLoading: donorLoading, isError } = useQuery({
    queryKey: ["duplicateEdit", id],
    queryFn: async () => {
      const data = await fetchDuplicateEditById(id);
      return data.data;
    },
  });

  // no need to show current 
  const { data: donors = [] } = useQuery({
    queryKey: ["donorsSelect", donor.indicomp_full_name, donor.indicomp_mobile_phone],
    queryFn: async () => {
      if (!donor.indicomp_full_name && !donor.indicomp_mobile_phone) return [];
      const token = Cookies.get("token");
      const response = await axios.get(
        `${BASE_URL}/api/donor-duplicate-change?indicomp_full_name=${donor.indicomp_full_name}&indicomp_mobile_phone=${donor.indicomp_mobile_phone}&indicomp_fts_id=${donor.indicomp_fts_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data?.data || [];
    },
  });

  
  useEffect(() => {
    if (donorData && !isInitialDataLoaded) {
      setDonor({
        indicomp_fts_id: donorData.indicomp_fts_id || "",
        indicomp_full_name: donorData.indicomp_full_name || "",
        indicomp_type: donorData.indicomp_type || "",
        indicomp_com_contact_name: donorData.indicomp_com_contact_name || "",
        indicomp_spouse_name: donorData.indicomp_spouse_name || "",
        indicomp_mobile_phone: donorData.indicomp_mobile_phone || "",
        indicomp_email: donorData.indicomp_email || "",
        indicomp_donor_type: donorData.indicomp_donor_type || "",
        indicomp_related_id: donorData.indicomp_related_id || "",
      });
      setIsInitialDataLoaded(true);
    }
  }, [donorData, isInitialDataLoaded]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!donor?.indicomp_fts_id || !selectedDonorId) {
      toast.error("Please select a donor to merge with.");
      return;
    }

    const data = {
      indicomp_fts_id: donor.indicomp_fts_id,
      new_indicomp_fts_id: selectedDonorId,
      indicomp_status: "0",
    };

    try {
      setIsSubmitting(true);
      const response = await fetchDuplicateEditByIdUpdate(id, data);

      if (response.data.code === 201) {
        toast.success(response.data.message);
        navigate("/donor/duplicate");
        queryClient.invalidateQueries(['duplicateList']);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Duplicate Update Error Occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (donorLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading donor details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600">Failed to load donor details</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/donor/duplicate")}
          className="flex items-center gap-2 h-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Merge Duplicate Donor</h1>
          <p className="text-xs text-gray-600 mt-1">
            Resolve duplicate donor records by merging with existing donor
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center w-full  ">
      
        <div className=" flex flex-col md:flex-row">
     
       
          <div className="border-l-2 border-l-orange-500 border-t border-b relative rounded-l-lg bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-base">{donor.indicomp_full_name}</CardTitle>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                  Duplicate
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-1 text-sm">
                <CompactInfoRow label="FTS ID" value={donor.indicomp_fts_id} />
           
                <CompactInfoRow label="Type" value={donor.indicomp_type} />
                <CompactInfoRow label="Donor Type" value={donor.indicomp_donor_type} />
                <CompactInfoRow label="Contact Name" value={donor.indicomp_com_contact_name} />
                <CompactInfoRow label="Mobile" value={donor.indicomp_mobile_phone} />
                <CompactInfoRow label="Email" value={donor.indicomp_email} />
                <CompactInfoRow label="Spouse Name" value={donor.indicomp_spouse_name} />
              </div>
            </CardContent>
  <div className="mb-2 mx-5 text-center  font-bold">
          

                 <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                  Selected to Delete
                </Badge>
            </div>
            <div className="bg-blue-50 border-blue-200 absolute bottom-0 rounded-b-lg">
          
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                <li>Duplicate criteria: Same Mobile or Donor Name</li>
                <li>Review carefully before merging</li>
                <li>This action cannot be undone</li>
              </ul>
            </CardContent>
          </div>
          </div>
 {/* Donors Table */}
 <div className="bg-white border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Select donor from below to replace with:</CardTitle>
              <CardDescription className="text-xs">
                Browse and select from all available donor records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <CompactDonorSelectTable 
                onDonorSelect={(id) => setSelectedDonorId(id)}
                selectedDonorId={selectedDonorId}
                donorName={donor.indicomp_full_name}
                donorPhone={donor.indicomp_mobile_phone}
              />
            </CardContent>
          </div>
         
       
          
          <div className="bg-white border-r border-t border-b rounded-r-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Merge className="h-4 w-4 text-blue-600" />
                Merge Action
              </CardTitle>
              <CardDescription className="text-xs">
                Select a donor to merge this duplicate record with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">
                    Select Donor to Merge With <span className="text-red-500">*</span>
                  </label>
                  <MemoizedSelect
                    value={selectedDonorId}
                    onChange={(value) => setSelectedDonorId(value)}
                    options={
                      donors?.map((item) => ({
                        value: item.indicomp_fts_id,
                        label: `${item.indicomp_full_name} (${item.indicomp_fts_id})`,
                      })) || []
                    }
                    placeholder="Select donor to merge with"
                  />
                </div>

                {selectedDonorId && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 font-medium">
                    Selected: {donors.find(d => d.indicomp_fts_id === selectedDonorId)?.indicomp_full_name}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedDonorId}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-8 text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <Merge className="h-3 w-3" />
                        Merge Donors
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/donor/duplicate")}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>

         
        </div>
      </div>
    </div>
  );
};

// Compact Info Row Component
const CompactInfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-0.5">
    <span className="font-medium text-gray-600 text-sm">{label}:</span>
    <span className="text-gray-900 text-sm">{value || "N/A"}</span>
  </div>
);

// Compact Donor Select Table Component
const CompactDonorSelectTable = ({ onDonorSelect, selectedDonorId ,donorName,donorPhone}) => {
  const {
    data: donors = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
  
    queryKey: ["donorsList", donorName, donorPhone],
    queryFn: async () => {
      if (!donorName && !donorPhone) return [];
      const token = Cookies.get("token");
      const response = await axios.get(
        `${BASE_URL}/api/donor-duplicate-change?indicomp_full_name=${encodeURIComponent(donorName)}&indicomp_mobile_phone=${encodeURIComponent(donorPhone)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data?.data || [];
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = [
    {
      id: "S. No.",
      header: "#",
      cell: ({ row }) => {
        const globalIndex = row.index + 1;
        return <div className="text-xs font-medium text-gray-600">{globalIndex}</div>;
      },
      size: 50,
    },
    {
      accessorKey: "indicomp_fts_id",
      id: "FTS ID",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-7 text-xs font-medium text-gray-700"
        >
          FTS ID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-xs font-mono font-medium bg-gray-50 px-1 py-0.5 rounded">
          {row.getValue("FTS ID")}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "indicomp_full_name",
      id: "Donor Name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-7 text-xs font-medium text-gray-700"
        >
          Donor Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-xs font-medium">{row.getValue("Donor Name")}</div>,
      size: 150,
    },
    {
      accessorKey: "indicomp_mobile_phone",
      id: "Mobile",
      header: "Mobile",
      cell: ({ row }) => <div className="text-xs">{row.getValue("Mobile")}</div>,
      size: 110,
    },
    {
      accessorKey: "indicomp_type",
      id: "Type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue("Type")}
        </Badge>
      ),
      size: 80,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant={selectedDonorId === row.original.indicomp_fts_id ? "default" : "outline"}
          size="sm"
          onClick={() => onDonorSelect(row.original.indicomp_fts_id)}
          className="h-6 text-xs px-2"
        >
          {selectedDonorId === row.original.indicomp_fts_id ? "Selected" : "Select"}
        </Button>
      ),
      size: 80,
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
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 6,
      },
    },
  });

  const TableShimmer = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-10">
        {table.getVisibleFlatColumns().map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="text-center">
          <div className="text-red-500 font-medium mb-1 text-xs">
            Error Fetching Donors
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="h-6 text-xs">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-60">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search donors..."
            value={table.getState().globalFilter || ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="pl-7 h-7 text-xs bg-white border-gray-300"
          />
        </div>
        <div className="text-xs text-gray-600">
          {table.getFilteredRowModel().rows.length} donors
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border h-[20rem]">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="h-8 px-2 text-xs font-semibold text-gray-700"
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
            {isFetching && !table.getRowModel().rows.length ? (
              <TableShimmer />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`h-10 hover:bg-gray-50 ${
                    selectedDonorId === row.original.indicomp_fts_id ? 'bg-blue-50' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-1">
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
                <TableCell colSpan={columns.length} className="h-20 text-center">
                  <div className="text-gray-500 text-xs">
                    No donors found
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 text-xs px-2"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 text-xs px-2"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateDonorEdit;