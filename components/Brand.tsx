import Image from 'next/image';
import Link from 'next/link';

interface BrandProps {
  compact?: boolean;
}

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link className={`brand${compact ? ' brand--compact' : ''}`} href="/" aria-label="VocaBox 홈">
      <span className="brand-mark" aria-hidden="true">
        <Image src="/icon-192.png" alt="" width={34} height={34} />
      </span>
      <span className="brand-name">
        Voca<span>Box</span>
      </span>
    </Link>
  );
}
