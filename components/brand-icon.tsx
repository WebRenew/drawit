import Link from "next/link"

export function BrandIcon() {
  return (
    <Link
      href="https://webrenew.com"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:opacity-80 transition-opacity"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 250 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-lg"
      >
        <rect width="250" height="250" rx="50" className="fill-foreground" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M50.9952 62.5H101.122C109.342 62.5 116.005 69.2836 116.005 77.6515V120.077C116.005 122.183 116.583 124.211 117.621 125.75L125.019 136.712L91.7784 186.177C90.5946 187.939 88.5813 187.941 87.3949 186.183L46.6159 125.75C45.5776 124.211 45 122.183 45 120.077V70.8066C45 66.219 47.6841 62.5 50.9952 62.5ZM133.995 77.6515C133.995 69.2836 140.658 62.5 148.878 62.5H199.005C202.316 62.5 205 66.219 205 70.8066V120.086C205 122.187 204.426 124.21 203.393 125.747L162.784 186.177C161.6 187.939 159.587 187.941 158.4 186.183L125.019 136.712L132.387 125.747C133.42 124.21 133.995 122.187 133.995 120.086V77.6515Z"
          className="fill-background"
        />
      </svg>
    </Link>
  )
}
