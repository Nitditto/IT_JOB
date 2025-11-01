import { useEffect, useState } from "react"
import { Link } from "react-router";
import api from "../../../../../utils/api";

export default function CompanyManageJobCreatePage() {
  useEffect(()=>{
    document.title="Thêm mới công việc";
  }, [])
    const [jobData, setJobData] = useState({
      name: "",
      minSalary: 0,
      maxSalary: 0,
      position: "",
      workstyle: "",
      location: "",
      tags: "",
      images: "",
      description: ""
    })
    const [jobImages, setJobImages] = useState([]);
    const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // This event fires when the file is successfully read
      reader.onload = (event) => {
        resolve({
          name: file.name,
          type: file.type,
          dataURL: event.target?.result // This is the ArrayBuffer (the "binary array")
        });
      };

      // This event fires if there's an error
      reader.onerror = (error) => {
        reject(error);
      };

      // This starts the read operation.
      reader.readAsDataURL(file);
    });
  };

  /**
   * The main handler for the file input's onChange event.
   */
  const handleFileChange = async (e) => {
    const fileList = e.target.files;

    // 1. Check if any files are selected
    if (!fileList || fileList.length === 0) {
      setJobImages([]); // Clear state if no files
      return;
    }

    // 2. Convert the FileList object to a standard array
    const files = Array.from(fileList);

    // 3. Create an array of promises (one for each file read)
    const fileReadPromises = files.map(readFileAsDataURL);

    // 

    try {
      // 4. Wait for ALL files to be read
      const allFilesData = await Promise.all(fileReadPromises);
      
      // 5. Save the resulting array of file data objects to state
      setJobImages(allFilesData);
      console.log("Successfully loaded files into state:", allFilesData);

    } catch (error) {
      console.error("Error reading one or more files:", error);
  };
  }
  const handleChange = (e) => {
    // Get the 'name' and 'value' from the input that triggered the change
    const { name, value } = e.target;

    // 3. Update the state
    setJobData((prevData) => ({
      ...prevData,   // <-- Copy all previous form data
      [name]: value,   // <-- Dynamically set the one field that changed
    }));
  };
      const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
            try {
                console.log(jobData.tags)
                console.log(jobImages)
                //await api.post(`/job/create`, jobData)
            } catch (error: any) {
                if (error.response && error.response.data) {
                    console.log(error.response.data);
                } else {
                    console.log("Có lỗi đã xảy ra. Vui lòng thử lại!")
                }
            }
        }
  return (
    <>
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
              <h1 className="sm:w-auto w-[100%] font-[700] text-[20px] text-black">
                Thêm mới công việc
              </h1>
              <Link to={"../company/job"} className="font-[400] text-[14px] text-[#0088FF] underline">
                Quay lại danh sách
              </Link>
            </div>
            
            <form onSubmit={formSubmission} action="" className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]">
              <div className="sm:col-span-2">
                <label htmlFor="title" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
                  Tên công việc
                </label>
                <input 
                  type="text" 
                  name="name"
                  onChange={handleChange}
                  value={jobData.name} 
                  id="title" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="salaryMin" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mức lương tối thiểu ($)
                </label>
                <input 
                  type="number" 
                  name="minSalary" 
                  id="salaryMin"
                  onChange={handleChange}
                  value={jobData.minSalary}
                  min={10}
                  step={10} 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="salaryMax" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mức lương tối đa ($)
                </label>
                <input 
                  type="number" 
                  name="maxSalary"
                  onChange={handleChange}
                  value={jobData.maxSalary}
                  min={10}
                  step={10} 
                  id="salaryMax" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="">
                <label htmlFor="position" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
                  Cấp bậc
                </label>
                <select 
                  name="position" 
                  id="position" 
                  onChange={handleChange}
                  value={jobData.position}
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                >
                  <option value=""></option>
                  <option value="intern">Intern</option>
                  <option value="fresher">Fresher</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="">
                <label htmlFor="workingForm" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
                  Hình thức làm việc
                </label>
                <select 
                  name="workstyle" 
                  onChange={handleChange}
                  value={jobData.workstyle}
                  id="workingForm" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                >
                  <option value=""></option>
                  <option value="onsite">Tại văn phòng</option>
                  <option value="remote">Làm từ xa</option>
                  <option value="flex">Linh hoạt</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="technologies" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Các công nghệ (Mỗi công nghệ được ngăn cách bởi dấu ;)
                </label>
                <input 
                  type="text" 
                  name="tags"
                  onChange={handleChange}
                  value={jobData.tags}
                  id="technologies" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="images" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
                  Danh sách ảnh
                </label>
                <input 
                  type="file" 
                  name="images" 
                  id="images" 
                  onChange={handleFileChange}
                  accept="image/*" 
                  multiple 
                  className=""
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mô tả chi tiết
                </label>
                <textarea 
                  name="description" 
                  id="description" 
                  onChange={handleChange}
                  value={jobData.description}
                  className="w-[100%] h-[350px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                ></textarea>
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-[#0088FF] rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white">
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
    </>
  )
}