import {
  DONOR_COMPANY_EDIT_FETCH,
  DONOR_COMPANY_FAMILY_GROUP_UPDATE,
  DONOR_COMPANY_UPDATE_SUMBIT,
} from "@/api";
import {
  useFetchDataSource,
  useFetchPromoter,
  useFetchState,
} from "@/hooks/use-api";
import belongs_to from "@/utils/belongs-to";
import company_type from "@/utils/company-type";
import donor_type from "@/utils/donor-type";
import honorific from "@/utils/honorific";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowLeft, Building, Info, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import InputMask from "react-input-mask";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AddToGroup from "./add-to-group";

// Shadcn Components
import { MemoizedSelect } from "@/components/common/memoized-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Constants
const gender = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const csr = [
  { value: "0", label: "No" },
  { value: "1", label: "Yes" },
];

const corrpreffer = [
  { value: "Registered", label: "Registered" },
  { value: "Branch Office", label: "Branch Office" },
  { value: "Digital", label: "Digital" },
];

const DonorCompanyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = Cookies.get("token");
  const [userImageBase, setUserImageBase] = useState("");
  const [noImageUrl, setNoImageUrl] = useState("");
  const [initialDonor, setInitialDonor] = useState({});
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // State
  const [donor, setDonor] = useState({
    indicomp_full_name: "",
    title: "",
    indicomp_com_contact_name: "",
    indicomp_com_contact_designation: "",
    indicomp_gender: "",
    indicomp_dob_annualday: "",
    indicomp_pan_no: "",
    indicomp_image_logo: "",
    indicomp_remarks: "",
    indicomp_promoter: "",
      indicomp_is_promoter: "No",
    indicomp_newpromoter: "",
    indicomp_belongs_to: "",
    indicomp_source: "",
    indicomp_donor_type: "",
    indicomp_csr: "",
    indicomp_type: "",
    indicomp_mobile_phone: "",
    indicomp_mobile_whatsapp: "",
    indicomp_email: "",
    indicomp_website: "",
    indicomp_res_reg_address: "",
    indicomp_res_reg_area: "",
    indicomp_res_reg_ladmark: "",
    indicomp_res_reg_city: "",
    indicomp_res_reg_state: "",
    indicomp_res_reg_pin_code: "",
    indicomp_off_branch_address: "",
    indicomp_off_branch_area: "",
    indicomp_off_branch_ladmark: "",
    indicomp_off_branch_city: "",
    indicomp_off_branch_state: "",
    indicomp_off_branch_pin_code: "",
    indicomp_corr_preffer: "",
  });

  const [errors, setErrors] = useState({});

  const { data: statesHooks, isLoading: isLoadingStates } = useFetchState();
  const { data: datasourceHook, isLoading: isLoadingDataSource } =
    useFetchDataSource();
  const { data: promoterHook, isLoading: isLoadingPromoter } =
    useFetchPromoter();
  const isLoadingHook =
    isLoadingStates || isLoadingDataSource || isLoadingPromoter;

  const states = statesHooks?.data || [];
  const datasource = datasourceHook?.data || [];
  const promoter = promoterHook?.data || [];

  const { data: donorData, isLoading } = useQuery({
    queryKey: ["donor-company", id],
    queryFn: async () => {
      const response = await axios.get(`${DONOR_COMPANY_EDIT_FETCH}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const donorData = response.data?.data;
      const cleanedData = {};

      Object.keys(donorData).forEach((key) => {
        cleanedData[key] = donorData[key] === null ? "" : donorData[key];
      });

      setDonor(cleanedData);
      setInitialDonor(cleanedData);

      const userImageBase = response.data.image_url.find(
        (img) => img.image_for === "Donor"
      )?.image_url;
      const noImageUrl = response.data.image_url.find(
        (img) => img.image_for === "No Image"
      )?.image_url;

      setUserImageBase(userImageBase);
      setNoImageUrl(noImageUrl);
      return response.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const isDirty = JSON.stringify(donor) !== JSON.stringify(initialDonor);
    setIsFormDirty(isDirty);
  }, [donor, initialDonor]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await axios({
        url: `${DONOR_COMPANY_UPDATE_SUMBIT}${id}?_method=PUT`,
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.code === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries(["donor-company", id]);
        navigate("/donor/donors");
      } else if (data.code === 400) {
        toast.error(data.message);
      } else {
        toast.error("Unexpected Error");
      }
    },
    onError: (error) => {
      console.error("Update error:", error.response.data.message);
      toast.error(
        error.response.data.message || "An error occurred during updating"
      );
    },
  });

  const familyGroupMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios({
        url: `${DONOR_COMPANY_FAMILY_GROUP_UPDATE}${id}`,
        method: "PATCH",
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.msg || "Data Successfully Updated");

      setShowModal(false);
      queryClient.invalidateQueries(["donor-company", id]);
    },
    onError: (error) => {
      toast.error("Failed to update family group");
    },
  });

  // Handlers
  const validateOnlyDigits = (inputtxt) => {
    const phoneno = /^\d+$/;
    return inputtxt.match(phoneno) || inputtxt.length === 0;
  };

  const onInputChange = (e) => {
    const { name, value } = e.target;

    if (
      [
        "indicomp_mobile_phone",
        "indicomp_mobile_whatsapp",
        "indicomp_res_reg_pin_code",
        "indicomp_off_branch_pin_code",
      ].includes(name)
    ) {
      if (validateOnlyDigits(value)) {
        setDonor((prev) => ({ ...prev, [name]: value }));
      }
    } else if (name === "indicomp_image_logo") {
      const file = e.target.files[0];
      setDonor((prev) => ({ ...prev, indicomp_image_logo: file }));
    } else {
      setDonor((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onSelectChange = (name, value) => {
    setDonor((prev) => ({ ...prev, [name]: value }));
  };

  const onChangePanNumber = (e) => {
    const panValue = e.target.value;
    // const panValue = e.target.value.toUpperCase().replace(/\s/g, '');
    setDonor({ ...donor, indicomp_pan_no: panValue });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!donor.indicomp_full_name?.trim()) {
      newErrors.indicomp_full_name = "Company Name is required";
    }
    if (!donor.indicomp_type) {
      newErrors.indicomp_type = "Company Type is required";
    }
    if (!donor.indicomp_com_contact_name) {
      newErrors.indicomp_com_contact_name = "Contact Name is required";
    }
    if (!donor.title) {
      newErrors.title = "Title is required";
    }
    if (!donor.indicomp_gender) {
      newErrors.indicomp_gender = "Gender is required";
    }
    if (
      !donor.indicomp_pan_no ||
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(donor.indicomp_pan_no)
    ) {
      newErrors.indicomp_pan_no =
        "Valid PAN Number is required (format: AAAAA9999A)";
    }
    if (!donor.indicomp_promoter) {
      newErrors.indicomp_promoter = "Promoter is required";
    }
    if (
      donor.indicomp_promoter === "Other" &&
      !donor.indicomp_newpromoter?.trim()
    ) {
      newErrors.indicomp_newpromoter = "Please specify promoter";
    }
    if (
      !donor.indicomp_mobile_phone ||
      !/^\d{10}$/.test(donor.indicomp_mobile_phone)
    ) {
      newErrors.indicomp_mobile_phone =
        "Valid 10-digit Mobile Number is required";
    }
    if (!donor.indicomp_res_reg_city?.trim()) {
      newErrors.indicomp_res_reg_city = "City is required";
    }
    if (!donor.indicomp_res_reg_state) {
      newErrors.indicomp_res_reg_state = "State is required";
    }
    if (
      !donor.indicomp_res_reg_pin_code ||
      !/^\d{6}$/.test(donor.indicomp_res_reg_pin_code)
    ) {
      newErrors.indicomp_res_reg_pin_code = "Valid 6-digit Pincode is required";
    }
    if (!donor.indicomp_corr_preffer) {
      newErrors.indicomp_corr_preffer = "Correspondence Preference is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    const formData = new FormData();

    const processValue = (value) => {
      if (value === "" || value === null || value === undefined) {
        return "";
      }
      return value;
    };

    formData.append(
      "indicomp_full_name",
      processValue(donor.indicomp_full_name)
    );
    formData.append("title", processValue(donor.title));
      formData.append(
      "indicomp_is_promoter",
      processValue(donor.indicomp_is_promoter)
    );
    formData.append("indicomp_type", processValue(donor.indicomp_type));
    formData.append(
      "indicomp_com_contact_name",
      processValue(donor.indicomp_com_contact_name)
    );
    formData.append(
      "indicomp_com_contact_designation",
      processValue(donor.indicomp_com_contact_designation)
    );
    formData.append("indicomp_gender", processValue(donor.indicomp_gender));
    formData.append(
      "indicomp_dob_annualday",
      processValue(donor.indicomp_dob_annualday)
    );
    formData.append("indicomp_pan_no", processValue(donor.indicomp_pan_no));

  
    if (donor.indicomp_image_logo instanceof File) {
      formData.append("indicomp_image_logo", donor.indicomp_image_logo);
    }
    formData.append("indicomp_remarks", processValue(donor.indicomp_remarks));
    formData.append("indicomp_promoter", processValue(donor.indicomp_promoter));
    formData.append(
      "indicomp_newpromoter",
      processValue(donor.indicomp_newpromoter)
    );
    formData.append("indicomp_source", processValue(donor.indicomp_source));
    formData.append("indicomp_csr", processValue(donor.indicomp_csr));
    formData.append(
      "indicomp_mobile_phone",
      processValue(donor.indicomp_mobile_phone)
    );
    formData.append(
      "indicomp_mobile_whatsapp",
      processValue(donor.indicomp_mobile_whatsapp)
    );
    formData.append("indicomp_email", processValue(donor.indicomp_email));
    formData.append("indicomp_website", processValue(donor.indicomp_website));
    formData.append(
      "indicomp_res_reg_address",
      processValue(donor.indicomp_res_reg_address)
    );
    formData.append(
      "indicomp_res_reg_area",
      processValue(donor.indicomp_res_reg_area)
    );
    formData.append(
      "indicomp_res_reg_ladmark",
      processValue(donor.indicomp_res_reg_ladmark)
    );
    formData.append(
      "indicomp_res_reg_city",
      processValue(donor.indicomp_res_reg_city)
    );
    formData.append(
      "indicomp_res_reg_state",
      processValue(donor.indicomp_res_reg_state)
    );
    formData.append(
      "indicomp_res_reg_pin_code",
      processValue(donor.indicomp_res_reg_pin_code)
    );
    formData.append(
      "indicomp_off_branch_address",
      processValue(donor.indicomp_off_branch_address)
    );
    formData.append(
      "indicomp_off_branch_area",
      processValue(donor.indicomp_off_branch_area)
    );
    formData.append(
      "indicomp_off_branch_ladmark",
      processValue(donor.indicomp_off_branch_ladmark)
    );
    formData.append(
      "indicomp_off_branch_city",
      processValue(donor.indicomp_off_branch_city)
    );
    formData.append(
      "indicomp_off_branch_state",
      processValue(donor.indicomp_off_branch_state)
    );
    formData.append(
      "indicomp_off_branch_pin_code",
      processValue(donor.indicomp_off_branch_pin_code)
    );
    formData.append(
      "indicomp_corr_preffer",
      processValue(donor.indicomp_corr_preffer)
    );
    formData.append(
      "indicomp_belongs_to",
      processValue(donor.indicomp_belongs_to)
    );
    formData.append(
      "indicomp_donor_type",
      processValue(donor.indicomp_donor_type)
    );

    updateMutation.mutate(formData);
  };

  const familyGroupStatus = (status) => {
    const data =
      status === "add_to_family_group"
        ? { indicomp_related_id: donor.indicomp_related_id }
        : { leave_family_group: "true" };

    familyGroupMutation.mutate(data);
  };

  if (isLoading || isLoadingHook) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1 p-4">
      {/* Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Building className="text-muted-foreground w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-md font-semibold text-gray-900">
                    Edit Company Donor
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Update company donor information and details
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
            <Button
              onClick={() => navigate("/donor/donors")}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Company Details Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm p-1 rounded-md px-1 font-medium bg-[var(--team-color)] text-white">
                <Info className="w-4 h-4" />
                Company Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Company Name */}
                <div className="">
                  <Label
                    htmlFor="indicomp_full_name"
                    className="text-xs font-medium"
                  >
                    Company Name *
                  </Label>
                  <Input
                    id="indicomp_full_name"
                    name="indicomp_full_name"
                    value={donor.indicomp_full_name}
                    onChange={onInputChange}
                    placeholder="Enter company name"
                  />
                  {errors?.indicomp_full_name && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_full_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Please don't add M/s before name
                  </p>
                </div>

                {/* Company Type */}
                <div className="">
                  <Label
                    htmlFor="indicomp_type"
                    className="text-xs font-medium"
                  >
                    Company Type *
                  </Label>
                  <Select
                    value={donor.indicomp_type}
                    onValueChange={(value) =>
                      setDonor((prev) => ({ ...prev, indicomp_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {company_type.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.indicomp_type && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_type}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div className="">
                  <Label htmlFor="title" className="text-xs font-medium">
                    Title *
                  </Label>
                  <Select
                    value={donor.title}
                    onValueChange={(value) =>
                      setDonor((prev) => ({ ...prev, title: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Title" />
                    </SelectTrigger>
                    <SelectContent>
                      {honorific.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.title && (
                    <p className="text-red-500 text-xs">{errors.title}</p>
                  )}
                </div>

                {/* Contact Name */}
                <div className="">
                  <Label
                    htmlFor="indicomp_com_contact_name"
                    className="text-xs font-medium"
                  >
                    Contact Name *
                  </Label>
                  <Input
                    id="indicomp_com_contact_name"
                    name="indicomp_com_contact_name"
                    value={donor.indicomp_com_contact_name}
                    onChange={onInputChange}
                    placeholder="Enter contact name"
                  />
                  {errors?.indicomp_com_contact_name && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_com_contact_name}
                    </p>
                  )}
                </div>

                {/* Designation */}
                <div className="">
                  <Label
                    htmlFor="indicomp_com_contact_designation"
                    className="text-xs font-medium"
                  >
                    Designation
                  </Label>
                  <Input
                    id="indicomp_com_contact_designation"
                    name="indicomp_com_contact_designation"
                    value={donor.indicomp_com_contact_designation}
                    onChange={onInputChange}
                    placeholder="Enter designation"
                  />
                </div>

                {/* Gender */}
                <div className="">
                  <Label
                    htmlFor="indicomp_gender"
                    className="text-xs font-medium"
                  >
                    Gender *
                  </Label>
                  <Select
                    value={donor.indicomp_gender}
                    onValueChange={(value) =>
                      setDonor((prev) => ({ ...prev, indicomp_gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {gender.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.indicomp_gender && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_gender}
                    </p>
                  )}
                </div>

                {/* Annual Day */}
                <div className="">
                  <Label
                    htmlFor="indicomp_dob_annualday"
                    className="text-xs font-medium"
                  >
                    Annual Day
                  </Label>
                  <Input
                    id="indicomp_dob_annualday"
                    name="indicomp_dob_annualday"
                    type="date"
                    value={donor.indicomp_dob_annualday}
                    onChange={onInputChange}
                  />
                </div>

                {/* PAN Number */}
                <div className="">
             
                  <InputMask
                    mask="aaaaa9999a"
                    value={donor.indicomp_pan_no}
                    onChange={(e) => onChangePanNumber(e)}
                    formatChars={{
                      9: "[0-9]",
                      a: "[A-Z]",
                    }}
                  >
                    {() => (
                      <div>
                        <Label
                          htmlFor="indicomp_pan_no"
                          className="text-xs  font-medium"
                        >
                          PAN Number
                        </Label>
                        <Input
                          type="text"
                          label="PAN Number"
                          name="panNumber"
                          placeholder="Enter PAN number"
                        />
                      </div>
                    )}
                  </InputMask>
                  {errors?.indicomp_pan_no && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_pan_no}
                    </p>
                  )}
                </div>

                {/* Upload Logo */}
                <div className="">
                  <Label
                    htmlFor="indicomp_image_logo"
                    className="text-xs font-medium"
                  >
                    Upload Logo
                  </Label>
                  <div className="flex items-center gap-2">
                    {donor.indicomp_image_logo && (
                      <img
                        src={
                          typeof donor.indicomp_image_logo === "string"
                            ? `${userImageBase}${donor.indicomp_image_logo}`
                            : URL.createObjectURL(donor.indicomp_image_logo)
                        }
                        alt="Company Logo"
                        className="w-8 h-8 object-cover rounded-md border"
                      />
                    )}
                    <Input
                      id="indicomp_image_logo"
                      name="indicomp_image_logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setDonor((prev) => ({
                          ...prev,
                          indicomp_image_logo: e.target.files[0],
                        }))
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload Company Logo
                  </p>
                </div>

                {/* Remarks */}
                <div className="">
                  <Label
                    htmlFor="indicomp_remarks"
                    className="text-xs font-medium"
                  >
                    Remarks
                  </Label>
                  <Input
                    id="indicomp_remarks"
                    name="indicomp_remarks"
                    value={donor.indicomp_remarks}
                    onChange={onInputChange}
                    placeholder="Enter remarks"
                  />
                </div>
<div className=" ">
                  <Label
                    htmlFor="indicomp_is_promoter"
                    className="text-xs font-medium"
                  >
                    Is Promoter?
                  </Label>
                  <Select
                    value={donor.indicomp_is_promoter}
                    onValueChange={(value) =>
                      setDonor((prev) => ({
                        ...prev,
                        indicomp_is_promoter: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Promoter */}
                <div className="">
                  <Label
                    htmlFor="indicomp_promoter"
                    className="text-xs font-medium"
                  >
                    Promoter *
                  </Label>
                
                  {isLoadingPromoter ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-gray-200 rounded-md w-full"></div>
                    </div>
                  ) : (
                    <MemoizedSelect
                      value={
                        promoter.find(
                          (p) => p.indicomp_fts_id == donor.indicomp_promoter
                        )?.indicomp_fts_id || ""
                      }
                 
                      onChange={(value) => {
                        setDonor((prev) => ({
                          ...prev,
                          indicomp_promoter: value,
                        }));
                      }}
                      options={promoter?.map((option) => ({
                        value: option.indicomp_fts_id,
                        label: option.indicomp_full_name,
                      }))}
                      placeholder="Select Promoter"
                    />
                  )}
                  {errors?.indicomp_promoter && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_promoter}
                    </p>
                  )}
                </div>

                {/* New Promoter (if Other selected) */}
                {donor.indicomp_promoter === "Other" && (
                  <div className="">
                    <Label
                      htmlFor="indicomp_newpromoter"
                      className="text-xs font-medium"
                    >
                      Promoter Details
                    </Label>
                    <Input
                      id="indicomp_newpromoter"
                      name="indicomp_newpromoter"
                      value={donor.indicomp_newpromoter}
                      onChange={onInputChange}
                      placeholder="Specify promoter"
                    />
                    {errors?.indicomp_newpromoter && (
                      <p className="text-red-500 text-xs">
                        {errors.indicomp_newpromoter}
                      </p>
                    )}
                  </div>
                )}

                {/* Belong To */}
                <div className="">
                  <Label
                    htmlFor="indicomp_belongs_to"
                    className="text-xs font-medium"
                  >
                    Belong To
                  </Label>
                  <Select
                    value={donor.indicomp_belongs_to}
                    onValueChange={(value) =>
                      setDonor((prev) => ({
                        ...prev,
                        indicomp_belongs_to: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Belong To" />
                    </SelectTrigger>
                    <SelectContent>
                      {belongs_to.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source */}
                <div className="">
                  <Label
                    htmlFor="indicomp_source"
                    className="text-xs font-medium"
                  >
                    Source
                  </Label>
                  <Select
                    value={donor.indicomp_source}
                    onValueChange={(value) =>
                      setDonor((prev) => ({ ...prev, indicomp_source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasource?.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.data_source_type}
                        >
                          {option.data_source_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Donor Type */}
                <div className="">
                  <Label
                    htmlFor="indicomp_donor_type"
                    className="text-xs font-medium"
                  >
                    Donor Type
                  </Label>
                  <Select
                    value={donor.indicomp_donor_type}
                    onValueChange={(value) =>
                      setDonor((prev) => ({
                        ...prev,
                        indicomp_donor_type: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Donor Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {donor_type.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CSR */}
                <div className="">
                  <Label htmlFor="indicomp_csr" className="text-xs font-medium">
                    CSR
                  </Label>
                  <Select
                    value={donor.indicomp_csr}
                    onValueChange={(value) =>
                      setDonor((prev) => ({ ...prev, indicomp_csr: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CSR" />
                    </SelectTrigger>
                    <SelectContent>
                      {csr.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Communication Details Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm p-1 rounded-md px-1 font-medium bg-[var(--team-color)] text-white">
                <Phone className="w-4 h-4" />
                Communication Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Mobile Phone */}
                <div className="">
                  <Label
                    htmlFor="indicomp_mobile_phone"
                    className="text-xs font-medium"
                  >
                    Mobile Phone *
                  </Label>
                  <Input
                    id="indicomp_mobile_phone"
                    name="indicomp_mobile_phone"
                    type="tel"
                    value={donor.indicomp_mobile_phone}
                    onChange={onInputChange}
                    maxLength={10}
                    placeholder="Enter mobile number"
                  />
                  {errors?.indicomp_mobile_phone && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_mobile_phone}
                    </p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="">
                  <Label
                    htmlFor="indicomp_mobile_whatsapp"
                    className="text-xs font-medium"
                  >
                    WhatsApp
                  </Label>
                  <Input
                    id="indicomp_mobile_whatsapp"
                    name="indicomp_mobile_whatsapp"
                    type="tel"
                    value={donor.indicomp_mobile_whatsapp}
                    onChange={onInputChange}
                    maxLength={10}
                    placeholder="Enter WhatsApp number"
                  />
                </div>

                {/* Email */}
                <div className="">
                  <Label
                    htmlFor="indicomp_email"
                    className="text-xs font-medium"
                  >
                    Email
                  </Label>
                  <Input
                    id="indicomp_email"
                    name="indicomp_email"
                    type="email"
                    value={donor.indicomp_email}
                    onChange={onInputChange}
                    placeholder="Enter email address"
                  />
                </div>

                {/* Website */}
                <div className="">
                  <Label
                    htmlFor="indicomp_website"
                    className="text-xs font-medium"
                  >
                    Website
                  </Label>
                  <Input
                    id="indicomp_website"
                    name="indicomp_website"
                    value={donor.indicomp_website}
                    onChange={onInputChange}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            </div>

            {/* Registered Address Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm p-1 rounded-md px-1 font-medium bg-[var(--team-color)] text-white">
                <MapPin className="w-4 h-4" />
                Registered Address
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Address */}
                <div className="">
                  <Label
                    htmlFor="indicomp_res_reg_address"
                    className="text-xs font-medium"
                  >
                    House & Street Number
                  </Label>
                  <Input
                    id="indicomp_res_reg_address"
                    name="indicomp_res_reg_address"
                    value={donor.indicomp_res_reg_address}
                    onChange={onInputChange}
                    placeholder="Enter address"
                  />
                </div>

                {/* Area */}
                <div className="">
                  <Label
                    htmlFor="indicomp_res_reg_area"
                    className="text-xs font-medium"
                  >
                    Area
                  </Label>
                  <Input
                    id="indicomp_res_reg_area"
                    name="indicomp_res_reg_area"
                    value={donor.indicomp_res_reg_area}
                    onChange={onInputChange}
                    placeholder="Enter area"
                  />
                </div>

                {/* Landmark */}
                <div className="">
                  <Label
                    htmlFor="indicomp_res_reg_ladmark"
                    className="text-xs font-medium"
                  >
                    Landmark
                  </Label>
                  <Input
                    id="indicomp_res_reg_ladmark"
                    name="indicomp_res_reg_ladmark"
                    value={donor.indicomp_res_reg_ladmark}
                    onChange={onInputChange}
                    placeholder="Enter landmark"
                  />
                </div>

                {/* City */}
                <div className="">
                  <Label
                    htmlFor="indicomp_res_reg_city"
                    className="text-xs font-medium"
                  >
                    City *
                  </Label>
                  <Input
                    id="indicomp_res_reg_city"
                    name="indicomp_res_reg_city"
                    value={donor.indicomp_res_reg_city}
                    onChange={onInputChange}
                    placeholder="Enter city"
                  />
                  {errors?.indicomp_res_reg_city && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_res_reg_city}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="">
                  <Label
                    htmlFor="indicomp_res_reg_state"
                    className="text-xs font-medium"
                  >
                    State *
                  </Label>
                  <Select
                    value={donor.indicomp_res_reg_state}
                    onValueChange={(value) =>
                      setDonor((prev) => ({
                        ...prev,
                        indicomp_res_reg_state: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.state_name}>
                          {state.state_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.indicomp_res_reg_state && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_res_reg_state}
                    </p>
                  )}
                </div>

                {/* Pincode */}
                <div className="">
                  <Label
                    htmlFor="indicomp_res_reg_pin_code"
                    className="text-xs font-medium"
                  >
                    Pincode *
                  </Label>
                  <Input
                    id="indicomp_res_reg_pin_code"
                    name="indicomp_res_reg_pin_code"
                    value={donor.indicomp_res_reg_pin_code}
                    onChange={onInputChange}
                    maxLength={6}
                    placeholder="Enter pincode"
                  />
                  {errors?.indicomp_res_reg_pin_code && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_res_reg_pin_code}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Branch Office Address Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm p-1 rounded-md px-1 font-medium bg-[var(--team-color)] text-white">
                <Building className="w-4 h-4" />
                Branch Office Address
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Office Address */}
                <div className="">
                  <Label
                    htmlFor="indicomp_off_branch_address"
                    className="text-xs font-medium"
                  >
                    Office & Street Number
                  </Label>
                  <Input
                    id="indicomp_off_branch_address"
                    name="indicomp_off_branch_address"
                    value={donor.indicomp_off_branch_address}
                    onChange={onInputChange}
                    placeholder="Enter office address"
                  />
                </div>

                {/* Office Area */}
                <div className="">
                  <Label
                    htmlFor="indicomp_off_branch_area"
                    className="text-xs font-medium"
                  >
                    Area
                  </Label>
                  <Input
                    id="indicomp_off_branch_area"
                    name="indicomp_off_branch_area"
                    value={donor.indicomp_off_branch_area}
                    onChange={onInputChange}
                    placeholder="Enter area"
                  />
                </div>

                {/* Office Landmark */}
                <div className="">
                  <Label
                    htmlFor="indicomp_off_branch_ladmark"
                    className="text-xs font-medium"
                  >
                    Landmark
                  </Label>
                  <Input
                    id="indicomp_off_branch_ladmark"
                    name="indicomp_off_branch_ladmark"
                    value={donor.indicomp_off_branch_ladmark}
                    onChange={onInputChange}
                    placeholder="Enter landmark"
                  />
                </div>

                {/* Office City */}
                <div className="">
                  <Label
                    htmlFor="indicomp_off_branch_city"
                    className="text-xs font-medium"
                  >
                    City
                  </Label>
                  <Input
                    id="indicomp_off_branch_city"
                    name="indicomp_off_branch_city"
                    value={donor.indicomp_off_branch_city}
                    onChange={onInputChange}
                    placeholder="Enter city"
                  />
                </div>

                {/* Office State */}
                <div className="">
                  <Label
                    htmlFor="indicomp_off_branch_state"
                    className="text-xs font-medium"
                  >
                    State
                  </Label>
                  <Select
                    value={donor.indicomp_off_branch_state}
                    onValueChange={(value) =>
                      setDonor((prev) => ({
                        ...prev,
                        indicomp_off_branch_state: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map((state) => (
                        <SelectItem key={state.id} value={state.state_name}>
                          {state.state_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Office Pincode */}
                <div className="">
                  <Label
                    htmlFor="indicomp_off_branch_pin_code"
                    className="text-xs font-medium"
                  >
                    Pincode
                  </Label>
                  <Input
                    id="indicomp_off_branch_pin_code"
                    name="indicomp_off_branch_pin_code"
                    value={donor.indicomp_off_branch_pin_code}
                    onChange={onInputChange}
                    maxLength={6}
                    placeholder="Enter pincode"
                  />
                </div>

                {/* Correspondence Preference */}
                <div className="">
                  <Label
                    htmlFor="indicomp_corr_preffer"
                    className="text-xs font-medium"
                  >
                    Correspondence Preference *
                  </Label>
                  <Select
                    value={donor.indicomp_corr_preffer}
                    onValueChange={(value) =>
                      setDonor((prev) => ({
                        ...prev,
                        indicomp_corr_preffer: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {corrpreffer.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.indicomp_corr_preffer && (
                    <p className="text-red-500 text-xs">
                      {errors.indicomp_corr_preffer}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isLoading || !isFormDirty}
                className="flex items-center gap-2"
              >
                {updateMutation.isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4" />
                    Update Company
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={donor.indicomp_related_id !== donor.indicomp_fts_id}
                variant={
                  donor.indicomp_related_id === donor.indicomp_fts_id
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={
                  donor.indicomp_related_id === donor.indicomp_fts_id
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                Attach to Group
              </Button>
              <Button
                type="button"
                onClick={() => familyGroupStatus("leave_family_group")}
                disabled={donor.indicomp_related_id === donor.indicomp_fts_id}
                variant={
                  donor.indicomp_related_id !== donor.indicomp_fts_id
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={
                  donor.indicomp_related_id !== donor.indicomp_fts_id
                    ? "bg-orange-600 hover:bg-orange-700"
                    : ""
                }
              >
                Leave Group
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate("/donor/donors")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>


      {showModal && (
        <AddToGroup
          id={donor.id}
          page="indivisual"
          isOpen={showModal}
          closegroupModal={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default DonorCompanyEdit;
