import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo-gigi.jpeg" alt="Gigi Papas" className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white object-cover shadow-lg" />
      <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-[#FF6B00]">Gigi Papas</h1>
      <p className="tracking-[0.3em] text-xs md:text-sm text-white/70">COMIDAS RAPIDAS</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
        <Link href="/login" className="bg-[#FF6B00] hover:bg-[#E55F00] text-white px-8 py-3 rounded-full font-semibold transition text-center">
          Iniciar sesion
        </Link>
        <Link href="/pedidos" className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-zinc-100 transition text-center">
          Ver pedidos
        </Link>
      </div>
    </div>
  );
}
