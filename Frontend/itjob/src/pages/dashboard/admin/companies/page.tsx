import { useEffect, useState } from 'react'
import api from '@/utils/api'
import translation from '@/utils/translation'
import type { Company } from '@/types'
import { Title } from '@/components/title/title'

export default function AdminCompanyListPage() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        document.title = 'Danh sách công ty'
        fetchCompanies()
    }, [])

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/company/list')
            // Đảm bảo lấy đúng mảng công ty từ phản hồi (hỗ trợ cả { data: [] } hoặc [])
            const companiesData: Company[] = Array.isArray(response.data.data)
                ? response.data.data
                : Array.isArray(response.data)
                  ? response.data
                  : []

            // Sử dụng Promise.all để gọi API đếm số việc làm đồng thời cho tất cả công ty
            const updatedCompanies = await Promise.all(
                companiesData.map(async (company) => {
                    try {
                        const jobRes = await api.get(
                            `/job/search?companyID=${company.id}`
                        )
                        // Kết quả của /job/search thường trả về mảng trực tiếp trong response.data
                        const jobs = Array.isArray(jobRes.data.data)
                            ? jobRes.data.data
                            : Array.isArray(jobRes.data)
                              ? jobRes.data
                              : []
                        return { ...company, jobCount: jobs.length }
                    } catch (err) {
                        console.error(
                            `Error fetching jobs for company ${company.id}:`,
                            err
                        )
                        return { ...company, jobCount: 0 }
                    }
                })
            )

            setCompanies(updatedCompanies)
        } catch (error) {
            console.error('Error fetching companies:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const translate = (key: string | null) => {
        if (!key) return 'N/A'
        return translation[key.toLowerCase()] || key
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <Title text="Danh sách công ty" />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        Công ty
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        Địa chỉ
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        Liên hệ
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold tracking-wider uppercase">
                                        Việc làm
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        Mô hình & Quy mô
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        Lịch làm việc
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                                        OT
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-12 text-center text-slate-400"
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                                                <span className="text-sm font-medium">
                                                    Đang tải dữ liệu...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : companies.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-12 text-center text-slate-400 italic"
                                        >
                                            Không tìm thấy công ty nào
                                        </td>
                                    </tr>
                                ) : (
                                    companies.map((company) => (
                                        <tr
                                            key={company.id}
                                            className="group transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                                #{company.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                                        <img
                                                            src={
                                                                company.avatar ||
                                                                '/assets/images/avatar.jpg'
                                                            }
                                                            alt={company.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="line-clamp-1 text-sm font-bold text-slate-900">
                                                            {company.name}
                                                        </div>
                                                        <div className="line-clamp-1 text-xs text-slate-500">
                                                            {company.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div
                                                    className="line-clamp-1 text-sm text-slate-600"
                                                    title={
                                                        company.address || ''
                                                    }
                                                >
                                                    {company.address}
                                                </div>
                                                <div className="text-xs font-medium text-slate-400">
                                                    {company.location?.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {company.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                                                    {company.jobCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="mb-1 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                    {translate(company.model)}
                                                </div>
                                                <div className="block text-[10px] text-slate-500 italic">
                                                    {translate(company.scale)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                                {company.startWork &&
                                                company.endWork ? (
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {company.startWork}{' '}
                                                            - {company.endWork}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${company.hasOvertime ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                                >
                                                    {company.hasOvertime
                                                        ? 'Có'
                                                        : 'Không'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
