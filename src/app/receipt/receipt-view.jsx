import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import numWords from "num-words";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Shadcn components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Lucide React icons
import { 
  ArrowLeft, 
  FileType, 
  Mail, 
  Printer, 
  FileText, 
  Loader2, 
  MailPlus,
  X,
  History,
  MessageCircleIcon
} from "lucide-react";

// Assets
import Logo1 from "../../assets/receipt/fts_log.png";
import Logo2 from "../../assets/receipt/top.png";
import Logo3 from "../../assets/receipt/ekal.png";
import tallyImg from "../../assets/tally.svg";
import mailSentGif from "../../assets/mail-sent.gif";


import axios from "axios";
import BASE_URL from "@/config/base-url";
import Cookies from "js-cookie";
import TimelineReceipt from "./timeline-receipt";
import useCreateFollowup from "@/hooks/use-create-followup";
import { getOrdinal } from "@/utils/get-ordinal";

const ReceiptOne = () => {
  const tableRef = useRef(null);
  const containerRef = useRef();
  const navigate = useNavigate();
  const createFollowupMutation = useCreateFollowup();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('ref');
    const queryClient = useQueryClient();
  const token = Cookies.get("token");
  const [donor1, setDonor1] = useState({ indicomp_email: "" });
  const [open, setOpen] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const [isPrintingLetter, setIsPrintingLetter] = useState(false);

  // Fetch receipt data
  const { data: receiptData, isLoading } = useQuery({
    queryKey: ['receiptView', id],
    queryFn: async () => {
      const { data } = await axios.get(
        `${BASE_URL}/api/receipt-view?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,  
  refetchOnReconnect: false,     
  refetchOnMount: false,        
  staleTime: 1000 * 60 * 5, 
  });

  const receipts = receiptData?.data || {};



  const chapter = receiptData?.data?.chapter || {};

  const authsign = receiptData?.auth_sign || [];
  const country = receiptData?.country || [];
  const amountInWords = numWords(receipts.receipt_total_amount || 0);

  
  const { data: receiptControl } = useQuery({
    queryKey: ['receiptControl'],
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/api/fetch-receipt-control`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      return response.data.data;
    },
  });

 
  const sendEmailMutation = useMutation({
  mutationFn: async () => {
    const response = await axios.get(
      `${BASE_URL}/api/send-receipt-email?id=${id}`,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      }
    );
    return response.data; 
  },

  onSuccess: (response) => {
    if (response?.code === 201) {
    
      toast.success(response.message);



      // receipts.receipt_email_count



      const followUpFormData = new FormData();
      followUpFormData.append('chapter_id', receipts.chapter_id);
      followUpFormData.append('indicomp_fts_id', receipts.indicomp_fts_id);
      
      const emailCount = receipts.receipt_email_count || 0;
      const emailNumber = emailCount + 1;
      
    


      followUpFormData.append('followup_heading', emailCount === 0 
        ? `${getOrdinal(emailNumber)} Email Delivered`
        : `${getOrdinal(emailNumber)} Email Sent`
      );
      followUpFormData.append('followup_description', emailCount === 0 
        ? `Initial receipt email sent to ${receipts.donor.indicomp_email}`
        : `Follow-up email sent to ${receipts.donor.indicomp_email}`
      );
      followUpFormData.append('followup_status', emailCount === 0 
        ? `Delivered`
        : `Sent`
      );
      
  
      createFollowupMutation.mutate(followUpFormData);

      queryClient.invalidateQueries(["receiptView", id]);
      queryClient.invalidateQueries(["followup-data", receipts.indicomp_fts_id]);
    } else {
      toast.error(response.message);
    }
  },

  onError: (error) => {
    toast.error(error.response?.data?.message || "Sent mail error");
  },
});

const getFileName = (prefix = 'R') => {
  const donorFirstName = receipts?.donor?.indicomp_full_name 
    ? receipts.donor.indicomp_full_name.split(' ')[0]
    : 'Unknown';
  
  return `${prefix}-${donorFirstName}-${receipts?.receipt_no || 'N/A'}`;
};
  
  const updateEmailMutation = useMutation({
    mutationFn: (formData) => 
      axios.patch(`${BASE_URL}/api/update-donor-email/${Cookies.get("ftsid")}`, formData, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      }),
    onSuccess: (response) => {
      if (response?.data.code == 201) {
        handleClose();
        queryClient.invalidateQueries(['receiptView', id]);
        toast.success(response?.data.message);
        setDonor1({ indicomp_email: "" });
      } else {
        toast.error(response?.data.message);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error on updating the mail");
    },
    onSettled: () => {
      setIsButtonDisabled(false);
    },
  });

  const handleSavePDF = () => {
    const input = tableRef.current;
    if (!input) return;

    setIsSavingPDF(true);
    const originalStyle = input.style.cssText;

    input.style.width = "210mm";
    input.style.minWidth = "210mm";
    input.style.margin = "2mm";
    input.style.padding = "2mm";
    input.style.boxSizing = "border-box";
    input.style.position = "absolute";
    input.style.left = "0";
    input.style.top = "0";

    const clone = input.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.visibility = "visible";
    document.body.appendChild(clone);

    html2canvas(clone, {
      scale: 2,
      width: 210 * 3.78,
      windowWidth: 210 * 3.78,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 0,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
    })
      .then((canvas) => {
        document.body.removeChild(clone);
        input.style.cssText = originalStyle;

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 2;
        const imgWidth = pdfWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

          
const fileName = `${getFileName('R')}.pdf`;
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
        pdf.save(fileName);
        const followUpFormData = new FormData();
        followUpFormData.append('chapter_id', receipts.chapter_id);
        followUpFormData.append('indicomp_fts_id', receipts.indicomp_fts_id);
        followUpFormData.append('followup_heading', "PDF Downloaded");
        followUpFormData.append('followup_description', `Receipt PDF was downloaded by ${Cookies.get('name')}`);
        followUpFormData.append('followup_status', "Completed");
        
        createFollowupMutation.mutate(followUpFormData);
      })
      .catch((error) => {
        console.error("Error generating PDF: ", error);
        document.body.removeChild(clone);
        input.style.cssText = originalStyle;
      })
      .finally(() => {
        setIsSavingPDF(false);
      });
  };

  const handleClickOpen = () => {
    setOpen(true);
    Cookies.set("ftsid", receipts.indicomp_fts_id + "");
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onInputChange = (e) => {
    setDonor1({
      ...donor1,
      [e.target.name]: e.target.value,
    });
  };

  const handlPrintPdf = useReactToPrint({
    content: () => containerRef.current,
     documentTitle: () => getFileName('L'),
    pageStyle: `
      @page {
        size: auto;
        margin: 1mm;
      }
      @media print {
        body {
          border: 0px solid #000;
          margin: 2mm;
          padding: 2mm;
          min-height: 100vh;
        }
        .print-hide {
          display: none;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `,
    onBeforeGetContent: () => setIsPrintingLetter(true),
    onAfterPrint: () => {
      setIsPrintingLetter(false);
      
  
      const followUpFormData = new FormData();
      followUpFormData.append('chapter_id', receipts.chapter_id);
      followUpFormData.append('indicomp_fts_id', receipts.indicomp_fts_id);
      followUpFormData.append('followup_heading', "Letter Head Printed");
      followUpFormData.append('followup_description', "Thank you letter was printed for physical copy");
      followUpFormData.append('followup_status', "Completed");
      
      createFollowupMutation.mutate(followUpFormData);
    },
  });

  const handlReceiptPdf = useReactToPrint({
    content: () => tableRef.current,
     documentTitle: () => getFileName('R'),
    pageStyle: `
      @page {
        size: auto;
        margin: 2mm;
      }
      @media print {
        body {
          border: 0px solid #000;
          margin: 2mm;
          padding: 2mm;
          min-height: 100vh;
        }
        .print-hide {
          display: none;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `,
    onBeforeGetContent: () => setIsPrintingReceipt(true),
    onAfterPrint: () => setIsPrintingReceipt(false),
  });

  const sendEmail = (e) => {
    e.preventDefault();
    sendEmailMutation.mutate();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) {
      e.target.reportValidity();
      return;
    }
    setIsButtonDisabled(true);
    updateEmailMutation.mutate(donor1);
  };

  const tallyReceipt = receipts?.tally_status;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className=" ">
      


      {receiptControl?.download_open === "Yes" && Cookies.get("user_type_id") != 4 && (
  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
    <Card className="p-3 shadow-2xl border border-white/30 backdrop-blur-lg bg-white/80 rounded-2xl hover:bg-white/90 transition-all duration-300">
      <div className="flex items-center gap-2">
      {tallyReceipt == "True" && (
        <div className="flex items-center pr-2  border-r border-gray-300/50 mr-1">
    
            <img src={tallyImg} alt="tallyImg" className="h-6 mr-1 opacity-90" />
        
        </div>
      )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSavePDF}
              disabled={isSavingPDF}
              className=" rounded-md transition-all duration-300 hover:scale-110 border border-[var(--color-border)] hover:shadow-md"
            >
              {isSavingPDF ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileType className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download PDF</TooltipContent>
        </Tooltip>

        {receipts?.donor?.indicomp_email ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={sendEmail}
                disabled={sendEmailMutation.isPending}
                className=" rounded-md relative transition-all duration-300 hover:scale-110 border border-[var(--color-border)]  hover:shadow-md"
              >
                {!sendEmailMutation.isPending && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-blue-500 text-white text-[12px] w-6 h-6 flex items-center justify-center border-2 border-white font-medium">
                    {receipts.receipt_email_count || 0}
                  </span>
                )}
                {sendEmailMutation.isPending ? (
                  <img src={mailSentGif} alt="Sending..." className="h-5 w-5" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send Mail</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClickOpen}
                className=" rounded-md transition-all duration-300 hover:scale-110 border border-[var(--color-border)]  hover:shadow-md"
              >
                <MailPlus className="h-5 w-5 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Mail</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlReceiptPdf}
              disabled={isPrintingReceipt}
              className="h-11 w-11 rounded-md transition-all duration-300 hover:scale-110 border  border-[var(--color-border)] hover:shadow-md"
            >
              {isPrintingReceipt ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Printer className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print Receipt</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlPrintPdf}
              disabled={isPrintingLetter}
              className=" rounded-md transition-all duration-300 hover:scale-110 border border-[var(--color-border)]  hover:shadow-md"
            >
              {isPrintingLetter ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print Letter</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled
              className=" rounded-md transition-all duration-300 hover:scale-110 border border-[var(--color-border)]  hover:shadow-md"
            >
       
                <MessageCircleIcon className="h-5 w-5 text-green-700" />
         
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print Letter</TooltipContent>
        </Tooltip>


        <TimelineReceipt donorId={receipts.indicomp_fts_id} />
      </div>
    </Card>
  </div>
)}

        {/* Main Content - 66/33 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Receipt Section - Left Side */}
          <Card className="p-4 col-span-1 lg:col-span-2 rounded-md">
            <div ref={tableRef} className="relative">
              <img
                src={Logo1}
                alt="water mark"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 w-auto h-56"
              />

              <div className="flex justify-between items-center border-t border-r border-l border-black">
                <img src={Logo1} alt="FTS logo" className="m-3 ml-12 w-auto h-16" />
                <div className="flex-1 text-center mr-24">
                  <img src={Logo2} alt="Top banner" className="mx-auto mb-0 w-80" />
                  <h2 className="text-xl font-bold mt-1">{chapter.chapter_name}</h2>
                </div>
                <img src={Logo3} alt="Ekal logo" className="m-3 mr-12 w-16 h-16" />
              </div>

              <div className="text-center border-x border-b border-black p-1 h-14">
                <p className="text-sm font-semibold mx-auto max-w-[90%]">
                  {`${chapter?.chapter_address || ""}, ${chapter?.chapter_city || ""} - ${
                    chapter?.chapter_pin || ""
                  }, ${chapter?.chapter_state || ""} 
                  ${chapter?.chapter_email ? `Email: ${chapter.chapter_email} |` : ""} 
                  ${chapter?.chapter_website ? `${chapter.chapter_website} |` : ""} 
                  ${chapter?.chapter_phone ? `Ph: ${chapter.chapter_phone} |` : ""} 
                  ${chapter?.chapter_whatsapp ? `Mob: ${chapter.chapter_whatsapp}` : ""}`}
                </p>
              </div>

              <div className="text-center border-x h-7 border-black p-1">
                <p className="text-[11px] font-medium mx-auto">
                  Head Office: Ekal Bhawan, 123/A, Harish Mukherjee Road, Kolkata-26. 
                  Web: www.ftsindia.com Ph: 033 - 2454 4510/11/12/13 PAN: AAAAF0290L
                </p>
              </div>

              <table className="w-full border-t border-black border-collapse text-[12px]">
                <tbody>
                  <tr>
                    <td className="border-l border-black p-1">Received with thanks from :</td>
                    <td className="border-l border-black p-1">Receipt No.</td>
                    <td className="p-2">:</td>
                    <td className="border-r border-black p-1">
                      <span className="font-bold">{receipts.receipt_ref_no}</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="border-l border-black" rowSpan="2">
                      {Object.keys(receipts).length !== 0 && (
                        <div className="ml-6 font-bold">
                          <p className="text-sm leading-tight">
                            {receipts.donor.indicomp_type !== "Individual" && "M/s"}
                            {receipts.donor.indicomp_type === "Individual" &&
                              receipts.donor.title}{" "}
                            {receipts.donor.indicomp_full_name}
                          </p>

                          {receipts.donor.indicomp_off_branch_address &&   (receipts.donor
                                                        .indicomp_corr_preffer ===
                                                        "Branch Office" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Office") && (
                            <div>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_off_branch_address}
                              </p>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_off_branch_area}
                              </p>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_off_branch_ladmark}
                              </p>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_off_branch_city} -{" "}
                                {receipts.donor.indicomp_off_branch_pin_code},
                                {receipts.donor.indicomp_off_branch_state}
                              </p>
                            </div>
                          )}

                          {receipts.donor.indicomp_res_reg_address &&     (receipts.donor
                                                        .indicomp_corr_preffer ===
                                                        "Registered" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Residence" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Digital") && (
                            <div>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_res_reg_address}
                              </p>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_res_reg_area}
                              </p>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_res_reg_ladmark}
                              </p>
                              <p className="text-sm leading-tight">
                                {receipts.donor.indicomp_res_reg_city} -{" "}
                                {receipts.donor.indicomp_res_reg_pin_code},
                                {receipts.donor.indicomp_res_reg_state}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border-l border-t border-black p-1">Date</td>
                    <td className="p-1 border-t border-black">:</td>
                    <td className="border-r border-t border-black p-1">
                      <span className="font-bold">
                        {moment(receipts.receipt_date).format("DD-MM-YYYY")}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="border-l border-t border-black p-1">On account of</td>
                    <td className="p-1 border-t border-black">:</td>
                    <td className="border-r border-t border-black p-1">
                      <span className="font-bold">{receipts.receipt_donation_type}</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="border-l border-black p-1">
                      <div className="flex items-center">
                        <span>
                          {country.find((coustate) => coustate.state_country === "India") && "PAN No :"}
                        </span>
                        <span className="font-bold ml-2">
                          {country.find((coustate) => coustate.state_country === "India") &&
                            receipts.donor.indicomp_pan_no}
                        </span>
                      </div>
                    </td>
                    <td className="border-l border-t border-black p-1">Pay Mode</td>
                    <td className="p-1 border-t border-black">:</td>
                    <td className="border-r border-t border-black p-1">
                      <span className="font-bold">{receipts.receipt_tran_pay_mode}</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="border-l border-t border-b border-black p-1">
                      Amount in words :
                      <span className="font-bold capitalize"> {amountInWords} Only</span>
                    </td>
                    <td className="border-l border-b border-t border-black p-1">Amount</td>
                    <td className="p-1 border-b border-t border-black">:</td>
                    <td className="border-r border-b border-t border-black p-1">
                      Rs. <span className="font-bold">{receipts.receipt_total_amount}</span> /-
                    </td>
                  </tr>

                  <tr>
                    <td className="border-l border-b border-r border-black p-1" colSpan="4">
                      Reference :
                      <span className="font-bold text-sm">{receipts.receipt_tran_pay_details}</span>
                    </td>
                  </tr>

                  <tr>
                    <td className="border-l border-b border-black p-1" colSpan="1">
                      {receipts.receipt_exemption_type === "80G" && (
                        <div className="text-[12px]">
                          {receipts.receipt_date > "2021-05-27" ? (
                            <>
                              Donation is exempt U/Sec.80G of the
                              <br />
                              Income Tax Act 1961 vide Order No.
                              AAAAF0290LF20214 Dt. 28-05-2021.
                            </>
                          ) : (
                            <>
                              This donation is eligible for deduction U/S 80(G) of the
                              <br />
                              Income Tax Act 1961 vide order
                              NO:DIT(E)/3260/8E/73/89-90 Dt. 13-12-2011.
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border-b border-r border-black p-1 text-right text-[12px]" colSpan="3">
                      For Friends of Tribals Society
                      <br />
                      <br />
                      <br />
                      {authsign.length > 0 && (
                        <div className="signature-section">
                          <div className="flex flex-col items-end">
                            {authsign.map((sig, key) => (
                              <div key={key} className="text-center">
                                {sig.signature_image && (
                                  <img
                                    src={sig.signature_image}
                                    alt={`${sig.indicomp_full_name}'s signature`}
                                    className="h-12 mb-1"
                                  />
                                )}
                                <span className="font-semibold">{sig.indicomp_full_name}</span>
                                {chapter.auth_sign ? (
                                  <div className="text-sm text-gray-600">{chapter.auth_sign}</div>
                                ) : (
                                  <div className="text-sm text-gray-500">Authorized Signatory</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Letter Section - Right Side */}
          <Card className="p-4 rounded-md">
  <div>
    <div className="flex justify-between">
      <div className="text-[#464D69] md:text-base text-sm">
        <p className="font-serif text-base">
          Date: {moment(receipts.receipt_date).format("DD-MM-YYYY")}
        </p>

        {Object.keys(receipts).length !== 0 && (
          <div className="mt-1 space-y-1">
            {receipts.receipt_donation_type !== "Membership" &&
              receipts.donor.indicomp_type !== "Individual" && (
                <p className="font-serif text-sm">
                  {receipts.donor.title}{" "}
                  {receipts.donor.indicomp_com_contact_name}
                </p>
              )}

            {receipts.donor.indicomp_type !== "Individual" && (
              <p className="font-serif text-sm">
                M/s {receipts.donor.indicomp_full_name}
              </p>
            )}

            {receipts.donor.indicomp_type === "Individual" && (
              <p className="font-serif text-sm">
                {receipts.donor.title}{" "}
                {receipts.donor.indicomp_full_name}
              </p>
            )}

            {receipts.donor.indicomp_off_branch_address &&   (receipts.donor
                                                        .indicomp_corr_preffer ===
                                                        "Branch Office" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Office")  && (
              <div className="space-y-0.5">
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_off_branch_address}
                </p>
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_off_branch_area}
                </p>
                <p className="text-sm">
                  {receipts.donor.indicomp_off_branch_ladmark}
                </p>
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_off_branch_city} -{" "}
                  {receipts.donor.indicomp_off_branch_pin_code},{" "}
                  {receipts.donor.indicomp_off_branch_state}
                </p>
              </div>
            )}

            {receipts.donor.indicomp_res_reg_address  &&     (receipts.donor
                                                        .indicomp_corr_preffer ===
                                                        "Registered" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Residence" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Digital") && (
              <div className="space-y-0.5">
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_res_reg_address}
                </p>
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_res_reg_area}
                </p>
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_res_reg_ladmark}
                </p>
                <p className="font-serif text-sm">
                  {receipts.donor.indicomp_res_reg_city} -{" "}
                  {receipts.donor.indicomp_res_reg_pin_code},{" "}
                  {receipts.donor.indicomp_res_reg_state}
                </p>
              </div>
            )}
          </div>
        )}

        <p className="my-2 font-serif text-sm">
          {receipts.donor?.indicomp_gender === "Female" &&
            "Respected Madam,"}
          {receipts.donor?.indicomp_gender === "Male" &&
            "Respected Sir,"}
          {receipts.donor?.indicomp_gender === null &&
            "Respected Sir,"}
        </p>

        {/* One Teacher School */}
        {receipts.receipt_donation_type === "One Teacher School" && (
          <div className="mt-1 text-justify space-y-2">
            <p className="font-serif text-sm text-center">
              Sub: Adoption of One Teacher School
            </p>
            <p className="font-serif text-sm leading-tight">
              We acknowledge with thanks the receipt of Rs.
              {receipts.receipt_total_amount}/- Rupees {amountInWords} Only via{" "}
              {receipts.receipt_tran_pay_mode == "Cash" ? (
                <>Cash for your contribution and adoption of {receipts.receipt_no_of_ots} OTS.</>
              ) : (
                <>{receipts.receipt_tran_pay_details} being for your contribution and adoption of {receipts.receipt_no_of_ots} OTS.</>
              )}
            </p>
            <p className="font-serif text-sm leading-tight">
              We convey our sincere thanks and gratitude for your kind support towards
              the need of our tribals...
            </p>
            <p className="font-serif text-sm leading-tight">
              We would like to state that our efforts are not only for mitigating the
              hardship...
            </p>
            <p className="font-serif text-sm leading-tight">
              We are pleased to enclose herewith our money receipt no.{" "}
              {receipts.receipt_ref_no} dated{" "}
              {moment(receipts.receipt_date).format("DD-MM-YYYY")}.
            </p>
          </div>
        )}

        {/* General Donation */}
        {receipts.receipt_donation_type === "General" && (
          <div className="mt-1 space-y-2">
            <p className="font-serif text-sm leading-tight">
              We thankfully acknowledge the receipt of Rs.
              {receipts.receipt_total_amount}/- via your{" "}
              {receipts.receipt_tran_pay_mode === "Cash"
                ? "Cash"
                : receipts.receipt_tran_pay_details}{" "}
              being Donation for Education.
            </p>
            <p className="font-serif text-sm leading-tight">
              We are pleased to enclose herewith our money receipt no.{" "}
              {receipts.receipt_ref_no} dated{" "}
              {moment(receipts.receipt_date).format("DD-MM-YYYY")}.
            </p>
          </div>
        )}

        {/* Membership */}
        {receipts.receipt_donation_type === "Membership" && (
          <div>
            <p className="font-serif text-sm leading-tight">
              We acknowledge with thanks receipt of your membership subscription upto{" "}
              {receipts?.m_ship_vailidity}.
            </p>
          </div>
        )}

        {/* Closing Lines */}
        {receipts.receipt_donation_type !== "Membership" && (
          <div className="space-y-1 mt-2">
            <p className="font-serif text-sm">Thanking you once again</p>
            <p className="font-serif text-sm">Yours faithfully,</p>
            <p className="font-serif text-sm">For Friends of Tribals Society</p>
            <p className="font-serif text-sm mt-4">
              {authsign.map((sig, key) => (
                <span key={key}>{sig.indicomp_full_name}</span>
              ))}
            </p>
            <p className="font-serif text-sm">{chapter.auth_sign}</p>
            <p className="font-serif text-sm">Encl: As stated above</p>
          </div>
        )}

        {receipts.receipt_donation_type === "Membership" && (
          <div className="space-y-1 mt-2">
            <p className="font-serif text-sm">With Best regards</p>
            <p className="font-serif text-sm">Yours sincerely</p>
            <p className="font-serif text-sm">
              {authsign.map((sig, key) => (
                <span key={key}>{sig.indicomp_full_name}</span>
              ))}
            </p>
            <p className="font-serif text-sm">{chapter.auth_sign}</p>
            <p className="font-serif text-sm">Encl: As stated above</p>
          </div>
        )}
      </div>
    </div>
  </div>
</Card>



          {/* only for print  */}
          <Card className="p-6 hidden ">
            <div ref={containerRef}>
              <div className="flex justify-between p-6 mt-44">
                <div className="text-[#464D69] md:text-xl text-sm">
                  <p className="font-serif text-[20px]">
                    Date: {moment(receipts.receipt_date).format("DD-MM-YYYY")}
                  </p>

                  {Object.keys(receipts).length !== 0 && (
                    <div className="mt-2">
                      {receipts.receipt_donation_type !== "Membership" &&
                        receipts.donor.indicomp_type !== "Individual" && (
                          <p className="font-serif text-[18px]">
                            {receipts.donor.title}{" "}
                            {receipts.donor.indicomp_com_contact_name}
                          </p>
                        )}

                      {receipts.donor.indicomp_type !== "Individual" && (
                        <p className="font-serif text-[18px]">
                          M/s {receipts.donor.indicomp_full_name}
                        </p>
                      )}

                      {receipts.donor.indicomp_type === "Individual" && (
                        <p className="font-serif text-[18px]">
                          {receipts.donor.title}{" "}
                          {receipts.donor.indicomp_full_name}
                        </p>
                      )}

                      {receipts.donor.indicomp_off_branch_address &&   (receipts.donor
                                                        .indicomp_corr_preffer ===
                                                        "Branch Office" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Office") && (
                        <div>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_off_branch_address}
                          </p>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_off_branch_area}
                          </p>
                          <p className="mb-0 text-xl">
                            {receipts.donor.indicomp_off_branch_ladmark}
                          </p>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_off_branch_city} -{" "}
                            {receipts.donor.indicomp_off_branch_pin_code},
                            {receipts.donor.indicomp_off_branch_state}
                          </p>
                        </div>
                      )}

                      {receipts.donor.indicomp_res_reg_address  &&     (receipts.donor
                                                        .indicomp_corr_preffer ===
                                                        "Registered" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Residence" ||
                                                        receipts.donor
                                                          .indicomp_corr_preffer ===
                                                          "Digital") && (
                        <div>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_res_reg_address}
                          </p>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_res_reg_area}
                          </p>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_res_reg_ladmark}
                          </p>
                          <p className="font-serif text-[18px]">
                            {receipts.donor.indicomp_res_reg_city} -{" "}
                            {receipts.donor.indicomp_res_reg_pin_code},
                            {receipts.donor.indicomp_res_reg_state}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="my-6 font-serif text-[18px] text-justify">
                    {receipts.donor?.indicomp_gender === "Female" && "Respected Madam,"}
                    {receipts.donor?.indicomp_gender === "Male" && "Respected Sir,"}
                    {receipts.donor?.indicomp_gender === null && "Respected Sir,"}
                  </p>

                  {receipts.receipt_donation_type === "One Teacher School" && (
                    <div className="mt-2 text-justify">
                      <p className="font-serif text-[18px] flex justify-center my-6">
                        Sub: Adoption of One Teacher School
                      </p>
                      <p className="font-serif text-[18px] text-justify leading-[1.2rem]">
                        We acknowledge with thanks the receipt of Rs.
                        {receipts.receipt_total_amount}/- Rupees {amountInWords} Only via{" "}
                        {receipts.receipt_tran_pay_mode == "Cash" ? (
                          <>Cash for your contribution and adoption of {receipts.receipt_no_of_ots} OTS.</>
                        ) : (
                          <>{receipts.receipt_tran_pay_details} being for your contribution and adoption of {receipts.receipt_no_of_ots} OTS.</>
                        )}
                      </p>

                      <p className="my-4 font-serif text-[18px] text-justify leading-[1.2rem]">
                        We convey our sincere thanks and gratitude for your kind support towards the need of our tribals and also the efforts being made by our Society for achieving comprehensive development of our tribals brethren particularly the literacy of their children and health & economic welfare.
                      </p>
                      <p className="font-serif text-[18px] text-justify leading-[1.2rem]">
                        We would like to state that our efforts are not only for mitigating the hardship and problems of our tribals but we are also trying to inculcate national character among them.
                      </p>
                      <p className="my-4 font-serif text-[18px] text-justify leading-[1.2rem]">
                        We are pleased to enclose herewith our money receipt no. {receipts.receipt_ref_no} dated{" "}
                        {moment(receipts.receipt_date).format("DD-MM-YYYY")} for the said amount together with a certificate U/sec. 80(G) of the I.T.Act. 1961.
                      </p>
                    </div>
                  )}

                  {receipts.receipt_donation_type === "General" && (
                    <div className="mt-2">
                      <p className="font-serif text-[18px] text-justify my-5 leading-[1.2rem]">
                        We thankfully acknowledge the receipt of Rs.
                        {receipts.receipt_total_amount}/- via your{" "}
                        {receipts.receipt_tran_pay_mode === "Cash" ? "Cash" : receipts.receipt_tran_pay_details}{" "}
                        being Donation for Education.
                      </p>

                      <p className="font-serif text-[18px] text-justify leading-[1.2rem]">
                        We are pleased to enclose herewith our money receipt no. {receipts.receipt_ref_no} dated{" "}
                        {moment(receipts.receipt_date).format("DD-MM-YYYY")} for the said amount.
                      </p>
                    </div>
                  )}

                  {receipts.receipt_donation_type === "Membership" && (
                    <div>
                      <p className="font-serif text-[18px] text-justify my-5 leading-[1.2rem]">
                        We acknowledge with thanks receipt of your membership subscription upto {receipts?.m_ship_vailidity}. Our receipt for the same is enclosed herewith.
                      </p>
                    </div>
                  )}

                  {receipts.receipt_donation_type !== "Membership" && (
                    <div>
                      <p className="my-3 font-serif text-[18px]">Thanking you once again</p>
                      <p className="font-serif text-[18px]">Yours faithfully, </p>
                      <p className="my-3 font-serif text-[18px]">For Friends of Tribals Society</p>
                      <p className="font-serif text-[18px] mt-10">
                        {authsign.map((sig, key) => (
                          <span key={key}>{sig.indicomp_full_name}</span>
                        ))}
                      </p>
                      <p className="font-serif text-[18px]">{chapter.auth_sign} </p>
                      <p className="my-2 font-serif text-[18px]">Encl: As stated above</p>
                    </div>
                  )}

                  {receipts.receipt_donation_type === "Membership" && (
                    <div>
                      <p className="font-serif text-[18px] text-justify my-5">With Best regards </p>
                      <p className="font-serif text-[18px] text-justify my-5">Yours sincerely </p>
                      <p className="font-serif text-[18px] text-justify my-5">
                        {authsign.map((sig, key) => (
                          <span key={key}>{sig.indicomp_full_name}</span>
                        ))}
                      </p>
                      <p className="font-serif text-[18px] text-justify my-5">{chapter.auth_sign} </p>
                      <p className="font-serif text-[18px] text-justify my-5">Encl: As stated above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Email Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Donor Email</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} autoComplete="off">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="indicomp_email">Email *</Label>
                  <Input
                    type="email"
                    id="indicomp_email"
                    name="indicomp_email"
                    value={donor1.indicomp_email}
                    onChange={onInputChange}
                    required
                    placeholder="Enter donor email"
                  />
                </div>
                <div className="flex justify-center">
                  <Button type="submit" disabled={isButtonDisabled}>
                    {isButtonDisabled ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ReceiptOne;