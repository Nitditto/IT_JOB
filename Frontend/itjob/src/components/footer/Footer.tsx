
import { Link } from 'react-router';
const Footer = () => {
  return (
    <div className="py-[24px] bg-[#000065]">
      <div className="container flex flex-col items-center">
        <Link
              to="/"
              className="mb-2"
            >
              <img src="/assets/images/logo.svg" alt="" className="w-auto h-10" />
        </Link>
        <div className="font-[400] text-[14px] text-[#A6A6A6] text-center">
          Copyright © ITJob
        </div>
      </div>
    </div>
  );
};

export default Footer;
