// components/Navbar.js
import React from 'react'
import Image from 'next/image'
import styles from '../styles/Navbar.module.css' // CSS modules import

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <Image src="/logo.png" alt="Logo" width={120} height={40} className={styles.logo} />
      </div>
      <div className={styles.navbarRight}>
        <button className={styles.navButton}>Sign In</button>
        <button className={`${styles.navButton} ${styles.highlight}`}>Register</button>
      </div>
    </nav>
  )
}

export default Navbar
