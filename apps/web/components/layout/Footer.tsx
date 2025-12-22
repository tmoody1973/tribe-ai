export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-black bg-white mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p className="font-bold">TRIBE © {currentYear}</p>
          <p>The Diaspora Intelligence Network</p>
        </div>
      </div>
    </footer>
  );
}
