// components/Layout.js
import React from 'react'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      {/* Optionally add Footer component */}
    </>
  )
}

export default Layout
