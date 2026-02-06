import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CountdownDrop from "@/components/CountdownDrop";
import ProductGrid from "@/components/ProductGrid";
import Manifesto from "@/components/Manifesto";
import DiscordCTA from "@/components/DiscordCTA";
import Footer from "@/components/Footer";

export default function StorePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <Hero />
      <CountdownDrop />
      <ProductGrid />
      <Manifesto />
      <DiscordCTA />
      <Footer />
    </main>
  );
}
