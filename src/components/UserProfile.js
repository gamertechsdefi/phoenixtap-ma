import Image from "next/image";
import { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import { useXPManager } from '@/api/firebase/fireFunctions';

import profile from '@/app/images/profile.png';

const UserProfile = () => {  // Destructure props correctly
    const [userDetails, setUserDetails] = useState(null);
    const userId = WebApp.initDataUnsafe?.user?.id;
  const { totalXP, isLoading } = useXPManager(userId);
    const [error, setError] = useState();
    const [loading, setLoading] = useState();
    const [user, setUsername] = useState("user");
  
    useEffect(() => {
      async function loadUserDetails() {
        try {
          const initData = WebApp.initDataUnsafe;
          setUsername(initData.user.first_name);
        }
        catch(error) {
          throw error;
        }
      }
      setLoading(false);
  
      loadUserDetails();
    }, []);
  
    if (loading) return <div>Loading user details...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
      <div className="p-2 m-4 sticky top-0 rounded-lg bg-[#f9f9f9]">
        <div className="flex flex-row justify-between items-center">
            <div className="flex gap-2 items-center">
                    <Image className="rounded-lg w-12 h-12" src={profile} alt="User" />
                <p className="font-bold text-neutral-900">{user}</p>
            </div>

            <div className="flex">
                <h2 className="font-bold text-orange-600">
                    <span className="pl-4">{totalXP} xp</span>
                </h2>
            </div>
        </div>
        </div>
    );
}

export default UserProfile;