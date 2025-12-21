import { Button } from "@/components/retroui/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="font-head text-4xl md:text-6xl text-center">
        TRIBE
      </h1>
      <p className="text-xl text-muted-foreground text-center max-w-md">
        The Diaspora Intelligence Network
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Button>Get Started</Button>
        <Button variant="secondary">Learn More</Button>
      </div>
    </main>
  );
}
