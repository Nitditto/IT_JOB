import { useCallback, useEffect, useReducer, useState } from "react"
import { Link } from "react-router";
import api from "../../../../../utils/api";
import { formReducer, handleFieldChange, handleFileChange } from "../../../../../utils/formUtils";
import { validate, validateEmpty, validateEmptyList, validateLowerBound, validateUpperBound } from "../../../../../utils/validateForms";

export default function CompanyManageJobCreatePage() {
  useEffect(()=>{
    document.title="Thêm mới công việc";
  }, [])
    const defaultJob = {
      data: {
        name: "",
        minSalary: 0,
        maxSalary: 0,
        position: "",
        workstyle: "",
        location: "",
        tags: "",
        images: [],
        description: ""
      },
      error: {
        name: "",
        minSalary: "",
        maxSalary: "",
        position: "",
        workstyle: "",
        images: ""
      },
      isLoading: false,
      status: {isError: false, reason: ""}

    }
    const [state, dispatch] = useReducer(formReducer(defaultJob), defaultJob)
    const { data, error, isLoading, status } = state;
  /**
   * The main handler for the file input's onChange event.
   */

      const formSubmission = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nameChecker = validate(
          data.name,
          [validateEmpty("Vui lòng nhập tên công việc!")]
        )
        const minSalaryChecker = validate(
          data.minSalary,
          [
            validateLowerBound(10, "Mức lương tối thiểu lớn hơn 10$!"),
            validateUpperBound(1000000, "Mức lương tối thiểu bé hơn 1,000,000$!")
          ]
        )
        const maxSalaryChecker = validate(
          data.maxSalary,
          [
            validateLowerBound(10, "Mức lương tối đa lớn hơn 10$!"),
            validateUpperBound(1000000, "Mức lương tối đa bé hơn 1,000,000$!"),
            validateLowerBound(data.minSalary, "Mức lương tối đa lớn hơn mức lương tối thiểu!")
          ]
        )

        const positionChecker = validate(
          data.position,
          [validateEmpty("Vui lòng chọn vị trí công việc!")]
        )

        const workstyleChecker = validate(
          data.workstyle,
          [validateEmpty("Vui lòng chọn hình thức làm việc!")]
        )

        const imagesChecker = validate(
          data.images,
          [validateEmptyList("Vui lòng chọn ảnh minh họa!")]
        )
        if (!nameChecker.status || 
          !minSalaryChecker.status || 
          !maxSalaryChecker.status ||
          !positionChecker.status ||
          !workstyleChecker.status ||
          !imagesChecker.status) {
            dispatch({
              type: "VALIDATE_FAILURE",
              payload: {
                name: nameChecker.reason,
                minSalary: minSalaryChecker.reason,
                maxSalary: maxSalaryChecker.reason,
                position: positionChecker.reason,
                workstyle: workstyleChecker.reason,
                images: imagesChecker.reason
              }
            })
            return;
          }
        dispatch({
          type: "SUBMIT_START"
        })
        try {
          console.log(data)
          dispatch({
            type: "SUBMIT_SUCCESS",
            payload: "Tạo công việc mới thành công!"

          })
        } catch (error: any) {
          dispatch({
            type: "SUBMIT_FAILURE",
            payload: error.response?.data || "Có lỗi đã xảy ra. Vui lòng thử lại!"
          })
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
                  onChange={handleFieldChange(dispatch)}
                  value={data.name} 
                  id="title" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
                {error.name && <div className="text-red-400">{error.name}</div>}
              </div>
              <div className="">
                <label htmlFor="salaryMin" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mức lương tối thiểu ($)
                </label>
                <input 
                  type="number" 
                  name="minSalary" 
                  id="salaryMin"
                  onChange={handleFieldChange(dispatch)}
                  value={data.minSalary}
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
                {error.minSalary && <div className="text-red-400">{error.minSalary}</div>}
              </div>
              <div className="">
                <label htmlFor="salaryMax" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mức lương tối đa ($)
                </label>
                <input 
                  type="number" 
                  name="maxSalary"
                  onChange={handleFieldChange(dispatch)}
                  value={data.maxSalary}
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                />
                {error.maxSalary && <div className="text-red-400">{error.maxSalary}</div>}
              </div>
              <div className="">
                <label htmlFor="position" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
                  Cấp bậc
                </label>
                <select 
                  name="position" 
                  id="position" 
                  onChange={handleFieldChange(dispatch)}
                  value={data.position}
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
                {error.position && <div className="text-red-400">{error.position}</div>}
              </div>
              <div className="">
                <label htmlFor="workingForm" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
                  Hình thức làm việc
                </label>
                <select 
                  name="workstyle" 
                  onChange={handleFieldChange(dispatch)}
                  value={data.workstyle}
                  id="workingForm" 
                  className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                >
                  <option value=""></option>
                  <option value="onsite">Tại văn phòng</option>
                  <option value="remote">Làm từ xa</option>
                  <option value="flex">Linh hoạt</option>
                </select>
                {error.workstyle && <div className="text-red-400">{error.workstyle}</div>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="technologies" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Các công nghệ (Mỗi công nghệ được ngăn cách bởi dấu ;)
                </label>
                <input 
                  type="text" 
                  name="tags"
                  onChange={handleFieldChange(dispatch)}
                  value={data.tags}
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
                  onChange={handleFileChange(dispatch)}
                  accept="image/*" 
                  multiple 
                  className=""
                />
                {error.images && <div className="text-red-400">{error.images}</div>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block font-[500] text-[14px] text-black mb-[5px]">
                  Mô tả chi tiết
                </label>
                <textarea 
                  name="description" 
                  id="description" 
                  onChange={handleFieldChange(dispatch)}
                  value={data.description}
                  className="w-[100%] h-[350px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                ></textarea>
              </div>
              <div className="sm:col-span-2">
                <button disabled={isLoading} type="submit" className="bg-[#0088FF] disabled:bg-[#0088FF]/50 rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white">
                  {isLoading ? "Đang xử lý..." : "Tạo mới"}
                </button>
                <div className={status.isError ? "text-red-400" : "text-green-400"}>{status.reason}</div>
              </div>
            </form>
          </div>
    </>
  )
}