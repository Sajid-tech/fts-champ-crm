import React from "react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import BASE_URL from "@/config/base-url";
import Select from 'react-select';

const EditPanelCondition = ({ id }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [formData, setFormData] = useState({
    chapter_ids: [],
    description: "",
    status: "",
  });

  const queryClient = useQueryClient();

  
  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" }
  ];

 
  const fetchPanelConditionData = async () => {
    if (!id) {
      toast.error("No ID provided for editing");
      return;
    }

    setIsLoadingData(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `${BASE_URL}/api/panel-condition/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data?.data) {
        const data = response.data.data;
        
       
        const chapterIdsArray = data.chapter_ids 
          ? data.chapter_ids.split(',').map(id => id.trim())
          : [];

        setFormData({
          chapter_ids: chapterIdsArray,
          description: data.description || "",
          status: data.status || "",
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch panel condition data"
      );
    } finally {
      setIsLoadingData(false);
    }
  };


  const fetchChapters = async () => {
    if (chapters.length > 0) return; 

    setIsLoadingChapters(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `${BASE_URL}/api/chapter-active`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data?.data) {
        setChapters(response.data.data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch chapters"
      );
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && id) {
      fetchChapters();
      fetchPanelConditionData();
    }
  };

  const handleSubmit = async () => {
    if (!formData.description.trim() || formData.chapter_ids.length === 0 || !formData.status) {
      toast.error("Description, at least one Chapter, and Status are required");
      return;
    }

    if (!id) {
      toast.error("No ID provided for updating");
      return;
    }

    setIsLoading(true);
    try {
      const token = Cookies.get("token");
      
   
      const putData = {
        ...formData,
        chapter_ids: formData.chapter_ids.join(",") 
      };

      const response = await axios.put(
        `${BASE_URL}/api/panel-condition/${id}`,
        putData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data.code == 201) {
        toast.success(response.data.message || "Panel Condition updated successfully");

        setFormData({
          chapter_ids: [],
          description: "",
          status: "",
        });
        await queryClient.invalidateQueries(["panelConditionList"]);
        setOpen(false);
      } else {
        toast.error(response.data.message || "Failed to update Panel Condition");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update Panel Condition"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleChapterChange = (selectedOptions) => {

    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setFormData((prev) => ({ 
      ...prev, 
      chapter_ids: selectedValues 
    }));
  };

  const handleStatusChange = (selectedOption) => {
    setFormData((prev) => ({ 
      ...prev, 
      status: selectedOption ? selectedOption.value : "" 
    }));
  };


  const chapterOptions = chapters?.map((item) => ({
    label: `${item.chapter_name} (${item.chapter_code})`,
    value: item.chapter_code.toString(),
  })) || [];


  const selectedChapterOptions = chapterOptions.filter(option => 
    formData.chapter_ids.includes(option.value)
  );


  const selectedStatusOption = statusOptions.find(option => 
    option.value === formData.status
  );
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "36px",
      borderRadius: "6px",
      borderColor: state.isFocused ? "black" : "#e5e7eb",
      boxShadow: state.isFocused ? "black" : "none",
      "&:hover": {
        borderColor: "none",
        cursor: "text",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
      backgroundColor: state.isSelected
        ? "#A5D6A7"
        : state.isFocused
        ? "#f3f4f6"
        : "white",
      color: state.isSelected ? "black" : "#1f2937",
      "&:hover": {
        backgroundColor: "#EEEEEE",
        color: "black",
      },
    }),

    menu: (provided) => ({
      ...provided,
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#616161",
      fontSize: "14px",
      display: "flex",
      flexDirection: "row",
      alignItems: "start",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "black",
      fontSize: "14px",
    }),
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Panel Condition</DialogTitle>
          <DialogDescription>
            Update the details for the Panel Condition
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
         
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Chapters</label>
              <Select
                isMulti
                name="chapter_ids"
                value={selectedChapterOptions}
                onChange={handleChapterChange}
                options={chapterOptions}
                isLoading={isLoadingChapters || isLoadingData}
                styles={customStyles}
                classNamePrefix="react-select"
                placeholder={
                  (isLoadingChapters || isLoadingData)
                    ? "Loading..." 
                    : "Select chapters"
                }
                noOptionsMessage={() => "No chapters available"}
                isDisabled={isLoadingChapters || isLoadingData}
              />
              {formData.chapter_ids.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.chapter_ids.length} chapter(s)
                </p>
              )}
            </div>

     
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                disabled={isLoadingData}
              />
            </div>

        
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                name="status"
                value={selectedStatusOption}
                onChange={handleStatusChange}
                options={statusOptions}
                isLoading={isLoadingData}
                styles={customStyles}
                classNamePrefix="react-select"
                placeholder="Select status"
                noOptionsMessage={() => "No status available"}
                isDisabled={isLoadingData}
              />
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isLoadingChapters || isLoadingData}
            className="mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Panel Condition"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPanelCondition;