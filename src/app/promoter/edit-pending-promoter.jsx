import React, { useState, useEffect, useRef } from "react";
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

import {
  Loader2,
  Edit,
  Search,
  ChevronDown,
  ArrowUpDown,
  X,
  Check,
  RefreshCw,
} from "lucide-react";
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
import { toast } from "sonner";
import BASE_URL from "@/config/base-url";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchPromoter } from "@/hooks/use-api";


const CACHE_KEY = 'cached_active_donors';
const CACHE_EXPIRY_KEY = 'cached_active_donors_expiry';
const CACHE_DURATION = 30 * 60 * 1000; 


const isCacheValid = () => {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
  
  if (!cachedData || !cacheExpiry) {
    return false;
  }
  
  const now = Date.now();
  const expiryTime = parseInt(cacheExpiry);

  if (now >= expiryTime) {
    clearCache();
    return false;
  }
  
  return true;
};

const getCachedData = () => {
  if (!isCacheValid()) {
    return null;
  }
  
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    return JSON.parse(cachedData);
  } catch (error) {
    console.error('Error parsing cached data:', error);
    clearCache();
    return null;
  }
};


const saveToCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};


const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_EXPIRY_KEY);
};

const EditPromoterPending = ({ name, refetchPendingPromoters }) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const { data: promoterHook, isLoading: isLoadingPromoter ,refetch} =
    useFetchPromoter();
  const [donors, setDonors] = useState([]);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorsError, setDonorsError] = useState(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [cacheExpiryTime, setCacheExpiryTime] = useState(null);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const backgroundFetchTimerRef = useRef(null);

  const cleanup = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Component unmounted or modal closed");
      abortControllerRef.current = null;
    }
    

    if (backgroundFetchTimerRef.current) {
      clearTimeout(backgroundFetchTimerRef.current);
      backgroundFetchTimerRef.current = null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const getRemainingCacheTime = () => {
    const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!cacheExpiry) return 0;
    
    const now = Date.now();
    const expiryTime = parseInt(cacheExpiry);
    return Math.max(0, expiryTime - now);
  };

  const fetchDonors = async (forceRefresh = false) => {

    if (donorsLoading) return;

    setDonorsLoading(true);
    setDonorsError(null);
    setIsUsingCache(false);
    setCacheExpiryTime(null);
    cleanup();

 
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData && isMountedRef.current) {
        setDonors(cachedData);
        setDonorsLoading(false);
        setIsUsingCache(true);
        
      
        const remainingTime = getRemainingCacheTime();
        setCacheExpiryTime(remainingTime);
        
        
        if (remainingTime < 5 * 60 * 1000) {
          fetchFreshDataInBackground();
        }
        return;
      }
    } else {

      clearCache();
    }

 
    const token = Cookies.get("token");
    abortControllerRef.current = new AbortController();

    try {
      const response = await axios.get(`${BASE_URL}/api/donor-active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
        timeout: 20000,
      });

      if (isMountedRef.current) {
        const donorsData = response.data.data || [];
        setDonors(donorsData);
        
      
        saveToCache(donorsData);
        

        setCacheExpiryTime(CACHE_DURATION);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Fetch cancelled");
        return;
      }
      console.error("Error fetching donors:", error);
      if (isMountedRef.current) {
        setDonorsError(error.message || "Failed to fetch donors");
      }
    } finally {
      if (isMountedRef.current) {
        setDonorsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };


  const fetchFreshDataInBackground = () => {
   
    if (backgroundFetchTimerRef.current) return;
    
    const remainingTime = getRemainingCacheTime();
    const timeToWait = Math.max(1000, remainingTime - (60 * 1000));
    
    backgroundFetchTimerRef.current = setTimeout(async () => {
      const token = Cookies.get("token");
      
      try {
        const response = await axios.get(`${BASE_URL}/api/donor-active`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        });
        
        const freshData = response.data.data || [];
        
      
        saveToCache(freshData);
        
   
        if (isMountedRef.current && isUsingCache && open) {
          setDonors(freshData);
          setCacheExpiryTime(CACHE_DURATION);
          toast.info("Promoter list updated with latest data");
        }
      } catch (error) {
        console.error("Background fetch error:", error);
      
        if (isMountedRef.current && open) {
          backgroundFetchTimerRef.current = setTimeout(fetchFreshDataInBackground, 60 * 1000);
        }
      } finally {
        backgroundFetchTimerRef.current = null;
      }
    }, timeToWait);
  };

  useEffect(() => {
    if (open) {
      fetchDonors();
    } else {
      cleanup();
      setDonors([]);
      setDonorsError(null);
      setIsUsingCache(false);
      setCacheExpiryTime(null);
    }
  }, [open]);

  const refetchDonors = () => {
    fetchDonors(true); 
  };

  const handleClearCache = () => {
    clearCache();
    setDonors([]);
    setCacheExpiryTime(null);
    fetchDonors(true); 
    toast.success("Cache cleared and fetching fresh data");
  };


  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const columns = React.useMemo(
    () => [
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
                className={`h-7 w-7 p-0 ${
                  isSelected ? "bg-green-600 hover:bg-green-700" : ""
                }`}
                onClick={() => handleSelectDonor(donor)}
                disabled={donorsLoading}
              >
                {isSelected && <Check className="h-4 w-4" />}
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
            disabled={donorsLoading}
          >
            ID
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs font-semibold">
            {row.getValue("indicomp_fts_id")}
          </div>
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
            disabled={donorsLoading}
          >
            Full Name
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm font-medium">
            {row.getValue("indicomp_full_name")}
          </div>
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
    ],
    [selectedDonor, donorsLoading]
  );

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

    setIsUpdating(true);
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

        if (refetchPendingPromoters) {
          refetchPendingPromoters();
        }
        refetch()
    
        clearCache();
        
        setOpen(false);
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to update promoter");
    
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update promoter");


    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectDonor = (donor) => {
    setSelectedDonor(donor);
  };

  const resetForm = () => {
    setSelectedDonor(null);
    setGlobalFilter("");
    setSorting([]);
    setColumnFilters([]);
    setColumnVisibility({});
    setRowSelection({});
    if (table) {
      table.reset();
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const TableShimmer = React.useMemo(() => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {columns.map((column) => (
          <TableCell key={column.id || column.accessorKey} className="py-2">
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [columns]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-5xl max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (donorsLoading || isUpdating) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Edit Pending Promoter:
              <span className="text-blue-600">{name}</span>
              {donorsLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              {isUsingCache && !donorsLoading && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">
                  Using Cached Data
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCache}
              className="h-8 w-8 p-0"
              title="Clear cache and refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Select a promoter from the table below to update {name}
            {isUsingCache && cacheExpiryTime && (
              <span className="ml-2 text-xs text-gray-500">
                (Cache expires in {formatTime(cacheExpiryTime)})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Current Name:{" "}
                  <span className="font-bold text-blue-700">{name}</span>
                </p>
                {selectedDonor && (
                  <p className="text-sm font-medium mt-1">
                    Selected:{" "}
                    <span className="font-bold">
                      {selectedDonor.indicomp_full_name}
                    </span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      ID: {selectedDonor.indicomp_fts_id}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isUpdating}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isUpdating || !selectedDonor}
                  className="min-w-[140px] h-9"
                >
                  {isUpdating ? (
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
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search promoters..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 h-9 text-sm"
                disabled={donorsLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetchDonors}
                disabled={donorsLoading}
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={donorsLoading}
                  >
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
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                        disabled={donorsLoading}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                          className="h-10 px-3 text-xs font-semibold bg-gray-50"
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
                    TableShimmer
                  ) : table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={`h-11 hover:bg-gray-50 ${
                          selectedDonor?.id === row.original.id
                            ? "bg-blue-50"
                            : ""
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
                            {donorsError
                              ? "Error loading promoters"
                              : "No promoters found"}
                          </p>
                          {donorsError && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={refetchDonors}
                              className="mt-2"
                            >
                              Retry
                            </Button>
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
              {isUsingCache && cacheExpiryTime && (
                <span className="ml-2 text-xs text-yellow-600">
                  (Cache expires in {formatTime(cacheExpiryTime)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage() || donorsLoading}
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
                disabled={!table.getCanNextPage() || donorsLoading}
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