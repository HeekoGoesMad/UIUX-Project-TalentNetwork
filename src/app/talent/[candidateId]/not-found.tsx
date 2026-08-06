import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <div className="container mx-auto max-w-md px-4 py-20 text-center"><p className="font-mono text-xs uppercase tracking-widest text-primary">404 / profile missing</p><h1 className="mt-3 text-3xl font-bold">This profile moved on.</h1><p className="mt-3 text-muted-foreground">Try another candidate from the network.</p><Button className="mt-6" asChild><Link href="/search">Return to search</Link></Button></div>; }
