import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 rounded-full bg-[#FF6B00] flex items-center justify-center text-4xl font-black border-4 border-white mb-4">G</div>
      <h1 className="text-4xl font-black text-[#FF6B00]">Gigi Papas</h1>
      <p className="tracking-[0.3em] text-sm text-white/70">COMIDAS RÁPIDAS</p>
      <p className="text-white/60 text-sm mt-2">Cliente Duvan Basanta • Sistema de Pedidos MVP Local</p>
      <div className="mt-8 flex gap-3">
        <Link href="/login" className="bg-[#FF6B00] hover:bg-[#E55F00] text-white px-8 py-3 rounded-full font-bold transition">
          Iniciar sesión
        </Link>
        <Link href="/pedidos" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-100 transition">
          Ver pedidos
        </Link>
      </div>
      <p className="text-xs text-white/40 mt-6">MVP $600K • localStorage mock • efectivo + transferencia • sin Prisma aún</p>
    </div>
  );
}
