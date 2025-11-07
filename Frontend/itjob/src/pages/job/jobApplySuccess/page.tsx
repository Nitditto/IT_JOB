import { Link } from 'react-router';
import { CheckCircle2 } from 'lucide-react'; // (Hoặc dùng ảnh của bạn)

// Bạn có thể tạo các component Card công việc nhỏ này
const SimilarJobCard = ({ title, company, logo }: any) => (
  <div className="flex items-center gap-3">
    <img src={logo} alt={company} className="w-12 h-12 rounded-md border" />
    <div>
      <h4 className="font-semibold text-gray-800 hover:text-red-600 cursor-pointer">{title}</h4>
      <p className="text-sm text-gray-600">{company}</p>
    </div>
  </div>
);

export default function JobApplySuccess() {
  return (
    // Background cong (giống trang apply)
    <div className="min-h-screen bg-gray-100 py-12 px-4"
         style={{ background: "linear-gradient(to bottom right, #1a0000 50%, #f3f4f6 50%)" }}
    >
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-8 text-center">
        
        {/* Bạn có thể thay icon này bằng ảnh robot của bạn */}
        <CheckCircle2 size={60} className="mx-auto text-green-500" />
        {/* <img src="/path/to/robot.png" alt="Success" className="mx-auto h-20 w-20" /> */}

        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          Amazing! We have received your CV
        </h1>

        <div className="text-left text-gray-600 mt-6 border-b pb-6">
          <p>We have received your CV for:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Position:</strong> Front End Developer (AngularJS/ReactJS/VueJS)</li>
            <li><strong>Company:</strong> Hitachi Digital Services</li>
          </ul>
          <p className="mt-4 text-sm">
            Your CV will be sent to the employer after it is approved by our review team. 
            Please check email <span className="font-semibold text-gray-800">example@gmail.com</span> to get updates on your CV status.
          </p>
        </div>

        <div className="text-left mt-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Have you seen these jobs in Ho Chi Minh?
          </h3>
          {/* Grid các công việc tương tự */}
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <SimilarJobCard title="Senior Front End Developer" company="Hitachi" logo="/logo-hitachi.png" />
            <SimilarJobCard title="Java Developer (AWS, VueJS)" company="FPT Software" logo="/logo-fpt.png" />
            <SimilarJobCard title="Fullstack Developer (Node.JS)" company="OnePay" logo="/logo-onepay.png" />
            <SimilarJobCard title="Senior Developer (Java/Golang)" company="LG" logo="/logo-lg.png" />
          </div>

          {/* Nút "Search for other similar jobs" sẽ link về trang chủ */}
          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="px-6 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50"
            >
              Search for other similar jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}