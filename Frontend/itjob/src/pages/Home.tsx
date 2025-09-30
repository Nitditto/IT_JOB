import { useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { Section1 } from "../components/section/Section1";
import { Title } from "../components/title/title";
import { FaUserTie } from "react-icons/fa";
import { CardCompanyItem } from "../components/card/CardCompanyItem";
import SearchPage from "./search/page";
import SearchHome from "./SearchHome";

export default function Home() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [name, setName] = useState("");
  const [hello, setHello] = useState("Hello world!");
  const getHelloFromName = async (name: string) => {
    const response = await axios.get(`${BACKEND_URL}/greetings?name=${name}`);
    setHello(response.data.content)
  }

  const handleInputEnter = async (event : React.KeyboardEvent) => {
    if (event.key === "Enter") {
      await getHelloFromName(name)
    }
  }
  return (
    <>
      <SearchPage/>
      {/* <SearchHome/>
      <div className="flex flex-col justify-center items-center space-y-5  w-full h-full">
        <p className='text-6xl text-blue-700'>{hello}</p>
        <div className="flex flex-row space-x-3">
          <input className="border text-blue-500 text-2xl" name="HelloWorldInput" onChange={e => setName(e.target.value)} onKeyDown={async e => await handleInputEnter(e)}></input>
          <button className="border-blue-500 border w-24" onClick={async () => await getHelloFromName(name)}>Change your name</button>
        </div>
      </div> */}
    </>
      
  )
}
