export function AuthLayout({ children, illustration }: { children: React.ReactNode, illustration: React.ReactNode }) {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-950 flex items-center justify-center">
      <div className="w-full h-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-0 px-6 sm:px-10 lg:px-16">
        <section className="flex flex-col justify-center h-full max-w-[460px] mx-auto w-full lg:pr-12">
          {children}
        </section>
        <section className="hidden lg:flex h-full py-6 lg:py-10 items-center justify-center lg:pl-12">
          <div className="w-full h-[calc(100vh-80px)] max-w-[840px]">
            {illustration}
          </div>
        </section>
      </div>
    </main>
  );
}
