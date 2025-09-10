export default function PageHeader({ left, center, right }) {
  return (
    <header className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-white">
      <div className="flex items-center justify-between">
        {/* Left side (back arrow, etc.) */}
        <div className="w-32 flex justify-start">{left}</div>

        {/* Center (title) */}
        <div className="flex-1 text-center">{center}</div>

        {/* Right side (settings icon, etc.) */}
        <div className="w-12 flex justify-end">{right}</div>
      </div>
    </header>
  );
}
