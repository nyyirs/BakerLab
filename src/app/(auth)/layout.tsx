import Image from 'next/image'
import Head from 'next/head'

export default function AuthLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <>
        <Head>
          <link 
            rel="preload" 
            href="/login_bg.avif" 
            as="image" 
            type="image/avif"
          />
        </Head>
        <div className="flex flex-col md:flex-row min-h-screen">
          {/* Left half - Solid background */}
          <div className="w-full md:w-1/2 bg-BakerLabBackground p-8 flex flex-col items-center justify-center">
            <div className="mb-8">
              <Image 
                src="/BakerLabLogo.png"
                alt="BakerLab Logo"
                width={200}
                height={80}
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </div>
            <div className="max-w-md">
              <h1 className="text-4xl font-bold text-primary-foreground mb-4 text-center">Hub Assistants IA</h1>                   
              {children}
              <p className="text-sm text-primary-foreground text-center mt-8">Vous avez un problème de connexion, contactez-nous.</p>  
            </div>
          </div>

          {/* Right half - Image */}
          <div className="w-full md:w-1/2 relative">
            <Image
              src="/login_bg.avif"
              alt="BakerLab background image"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </>
    );
}