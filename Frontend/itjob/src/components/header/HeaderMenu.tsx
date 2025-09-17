import { Link } from "react-router";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
export const HeaderMenu = (props: {
  showMenu:boolean
}) => {
  const {showMenu}=props;

  const menuList = [
    {
      name: "Việc Làm IT",
      link: "#",
      children: [
        {
          name: "Việc làm IT theo kỹ năng",
          link: "#",
          children: [
            {
              name: "ReactJS",
              link: "#",
            },
            {
              name: "NodeJS",
              link: "#",
            },
            {
              name: "Javascript",
              link: "#",
            },
            {
              name: "HTML5",
              link: "#",
            },
            {
              name: "CSS3",
              link: "#",
            },
          ],
        },
        {
          name: "Việc làm IT theo công ty",
          link: "#",
        },
        {
          name: "Việc làm IT theo thành phố",
          link: "#",
        },
      ],
    },
    {
      name: "Top Công Ty IT",
      link: "#",
      children: [
        {
          name: "FPT Software",
          link: "#",
        },
        {
          name: "Techcombank",
          link: "#",
        },
        {
          name: "MB Bank",
          link: "#",
        },
      ],
    },
    {
      name: "Nhà Tuyển Dụng",
      link: "#",
      children: [
        {
          name: "Đăng Nhập",
          link: "#",
        },
        {
          name: "Đăng Ký",
          link: "#",
        },
      ],
    },
  ];
  return (
    <>
      <nav className={"lg:block " + (showMenu ? "fixed top-0 left-0 w-[280px] h-[100vh] bg-blue-800" : "hidden")}>
        <ul className="flex gap-x-[30px] flex-wrap">
          {menuList.map((menu, index) => (
            <li
              key={index}
              className="inline-flex lg:w-auto w-full lg:justify-start justify-between gap-x-[8px] items-center relative  group/sub-1 lg:p-0 p-[10px] flex-wrap"
            >
              <Link
                to={menu.link}
                className="font-[600] text-[16px] text-white"
              >
                {menu.name}
              </Link>
              {menu.children && (
                <>
                  <FaAngleDown className="text-[16px] text-white" />
                  <ul className="hidden bg-[#000065] lg:absolute relative lg:top-[100%] top-0 left-0 lg:w-[280px] w-full rounded-[4px] group-hover/sub-1:block">
                    {menu.children.map((menuSub1, indexSub1) => (
                      <li
                        key={indexSub1}
                        className="flex items-center flex-wrap justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096] group/sub-2"
                      >
                        <Link
                          to={menuSub1.link}
                          className="font-[600] text-[16px] text-white"
                        >
                          {menuSub1.name}
                        </Link>
                        {menuSub1.children && (
                          <>
                            <FaAngleRight className="text-[16px] text-white" />
                            <ul className="hidden bg-[#000065] lg:absolute relative top-0 lg:left-[100%] left-0 lg:w-[280px] w-full rounded-[4px] group-hover/sub-2:block">
                              {menuSub1.children.map((menuSub2, indexSub2) => (
                                <li
                                  key={indexSub2}
                                  className="flex items-center justify-between py-[10px] px-[16px] rounded-[4px] hover:bg-[#000096]"
                                >
                                  <Link
                                    to={menuSub2.link}
                                    className="font-[600] text-[16px] text-white"
                                  >
                                    {menuSub2.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};
