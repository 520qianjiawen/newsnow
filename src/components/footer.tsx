export function Footer() {
  const year = new Date().getFullYear()
  const displayYear = year === 2024 ? "2024" : `2024-${year}`

  return (
    <span>
      <a href="https://news.neutemu.com/" target="_blank" className="hover:underline">
        新闻与实时热搜
      </a>
      <span>
        {" "}
        ©
        {displayYear}
        {" "}
        By
        {" "}
      </span>
      <a href="https://www.neutemu.com/" target="_blank" className="hover:underline">
        Neutemu
      </a>
    </span>
  )
}
