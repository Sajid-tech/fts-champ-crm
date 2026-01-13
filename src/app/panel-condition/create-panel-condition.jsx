import React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { Loader2, SquarePlus } from "lucide-react";
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

const CreatePanelCondition = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [formData, setFormData] = useState({
    chapter_ids: [],
    description: "",
  });

  const queryClient = useQueryClient();

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
    if (isOpen) {
      fetchChapters();
    }
  };

  const handleSubmit = async () => {
    if (!formData.description.trim() || formData.chapter_ids.length === 0) {
      toast.error("Description and at least one Chapter are required");
      return;
    }

    setIsLoading(true);
    try {
      const token = Cookies.get("token");
      
      const postData = {
        ...formData,
        chapter_ids: formData.chapter_ids.join(",")
      };

      const response = await axios.post(
        `${BASE_URL}/api/panel-condition`,
        postData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response?.data.code == 201) {
        toast.success(response.data.message || "Panel Condition created successfully");

        setFormData({
          chapter_ids: [],
          description: "",
        });
        await queryClient.invalidateQueries(["panelConditionList"]);
        setOpen(false);
      } else {
        toast.error(response.data.message || "Failed to create Panel Condition");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create Panel Condition"
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
    
    if (selectedValues.includes("all") && !formData.chapter_ids.includes("all")) {
      const allChapterValues = chapters.map(item => item.chapter_code.toString());
      setFormData(prev => ({ 
        ...prev, 
        chapter_ids: [ ...allChapterValues]
      }));
    } else if (!selectedValues.includes("all") && formData.chapter_ids.includes("all")) {
      setFormData(prev => ({ 
        ...prev, 
        chapter_ids: selectedValues
      }));
    } else if (selectedValues.includes("all") && formData.chapter_ids.includes("all")) {
      const filteredValues = selectedValues.filter(value => value !== "all");
      setFormData(prev => ({ 
        ...prev, 
        chapter_ids: filteredValues
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        chapter_ids: selectedValues
      }));
    }
  };

  const allOption = { label: "Select All", value: "all" };
  
  const chapterOptions = [
    allOption,
    ...(chapters?.map((item) => ({
      label: `${item.chapter_name} (${item.chapter_code})`,
      value: item.chapter_code.toString(),
    })) || [])
  ];

  const selectedChapterOptions = chapterOptions.filter(option => 
    formData.chapter_ids.includes(option.value)
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
        <Button variant="default" className="ml-2">
          <SquarePlus className="h-4 w-4 mr-2" /> Panel Condition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Panel Condition</DialogTitle>
          <DialogDescription>
            Enter the details for the new Panel Condition
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
                isLoading={isLoadingChapters}
                styles={customStyles}
                classNamePrefix="react-select"
                placeholder={
                  isLoadingChapters 
                    ? "Loading chapters..." 
                    : "Select chapters"
                }
                noOptionsMessage={() => "No chapters available"}
                isDisabled={isLoadingChapters}
              />
              {formData.chapter_ids.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formData.chapter_ids.includes("all") ? "All chapters" : `${formData.chapter_ids.length} chapter(s)`} 
                  {!formData.chapter_ids.includes("all") && ` - Codes: ${formData.chapter_ids.join(", ")}`}
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
              />
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isLoadingChapters}
            className="mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Panel Condition"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePanelCondition;