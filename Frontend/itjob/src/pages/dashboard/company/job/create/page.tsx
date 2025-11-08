import { useCallback, useEffect, useReducer, useState } from "react"
import { Link, redirect } from "react-router";
import api from "../../../../../utils/api";
import { formReducer, handleFieldChange, handleFileChange } from "../../../../../utils/formUtils";
import { validate, validateEmpty, validateEmptyList, validateLowerBound, validateUpperBound } from "../../../../../utils/validateForms";
import axios from "axios";
import type { Location } from "@/types";

export default function CompanyManageJobCreatePage() {
  const [location, setLocation] = useState(Array<Location>);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const init = async () => {
      try {
        const locationRes = await axios.get<Array<Location>>(`${BACKEND_URL}/location`);
        setLocation(locationRes.data);
        document.title = "Thêm mới công việc"
      } catch (error) {
        console.error(error);
      }
    }

    init();
  }, [])
  const defaultJob = {
    data: {
      name: "",
      minSalary: 0,
      maxSalary: 0,
      position: "",
      workstyle: "",
      address: "",
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
    status: { isError: false, reason: "" }

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

    const addressChecker = validate(
      data.address,
      [validateEmpty("Vui lòng điền địa điểm công ty!")]
    )

    const locationChecker = validate(
      data.location,
      [validateEmpty("Vui lòng chọn khu vực!")]
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
      !addressChecker.status ||
      !locationChecker.status ||
      !imagesChecker.status) {
      dispatch({
        type: "VALIDATE_FAILURE",
        payload: {
          name: nameChecker.reason,
          minSalary: minSalaryChecker.reason,
          maxSalary: maxSalaryChecker.reason,
          position: positionChecker.reason,
          workstyle: workstyleChecker.reason,
          address: addressChecker.reason,
          location: locationChecker.reason,
          images: imagesChecker.reason
        }
      })
      return;
    }
    dispatch({
      type: "SUBMIT_START"
    })
    try {
      await api.post("/job/create", { ...data, "tags": data.tags.split(";") })
      dispatch({
        type: "SUBMIT_SUCCESS",
        payload: "Tạo công việc mới thành công!"

      })
      redirect("/dashboard/company/job")
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
            <label htmlFor="salaryMin" aria-required className="required block font-[500] text-[14px] text-black mb-[5px]">
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
            <label htmlFor="salaryMax" aria-required className="required block font-[500] text-[14px] text-black mb-[5px]">
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
              <option value="hybrid">Linh hoạt</option>
            </select>
            {error.workstyle && <div className="text-red-400">{error.workstyle}</div>}
          </div>
          <div className="">
            <label htmlFor="address" aria-required className=" required block font-[500] text-[14px] text-black mb-[5px]">
              Địa chỉ công ty
            </label>
            <input
              type="text"
              name="address"
              onChange={handleFieldChange(dispatch)}
              value={data.address}
              id="address"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
            />
            {error.address && <div className="text-red-400">{error.address}</div>}
          </div>
          <div className="">
            <label htmlFor="location" aria-required className="block font-[500] text-[14px] text-black mb-[5px] required">
              Khu vực
            </label>
            <select
              name="location"
              onChange={handleFieldChange(dispatch)}
              value={data.location}
              id="location"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
            >
              <option value=""></option>
              {
                location.map(value => (
                  <option value={value.abbreviation}>{value.name}</option>
                ))
              }
            </select>
            {error.location && <div className="text-red-400">{error.location}</div>}
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
        </form >
      </div >
    </>
  )
}