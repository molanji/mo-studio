import './globals.css'

export const metadata = {
  title: 'MO Studio',
  description: 'Your internal tools hub',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
