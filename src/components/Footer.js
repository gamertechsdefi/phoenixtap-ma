import Link from "next/link";

export default function Footer(){
    return(
        <footer className="bg-gradient-to-b from-neutral-700 to-neutral-900 text-white sticky bottom-0 flex flex-row gap-12 justify-center px-8 py-4 ">
            <Link href="/" className="text-sm">Home</Link>
            <Link href="/tasks" className="text-sm">Earn</Link>
            <Link href="/friends" className="text-sm">Friends</Link>
            <Link href="/claim" className="text-sm">Profile</Link>
        </footer>
    );
}