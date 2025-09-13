import React from 'react'
import { Link } from 'react-router';
import { HeaderMenu } from './HeaderMenu';

export const Header = () => {
  return (
    <>
      <header className="bg-[#000071] py-[15px]">
        <div className="container">
          <div className="flex justify-between items-center">
            <Link
              to="/"
              className="font-[800] text-[28px] text-white flex-none"
            >
              Next.ITJob
            </Link>
            <nav>
                          <HeaderMenu>
              Test 1
            </HeaderMenu>
            <HeaderMenu>
              Test 2
            </HeaderMenu>
            <HeaderMenu>
              Test 3
            </HeaderMenu>
            </nav>
          </div>
        </div>
      </header>
    </>
  )
}
