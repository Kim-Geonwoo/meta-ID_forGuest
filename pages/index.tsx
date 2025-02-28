"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-9xl font-extrabold text-gray-700">Err</h1>
        <h2 className="text-3xl font-semibold mt-4 mb-2">올바르지 않은 접속입니다.</h2>
        <p className="text-xl text-gray-600 mb-8">URL주소뒤에 명함의 ShortURL이 누락되었습니다.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 space-y-4"
      >
        <Link
          href="https://google.com"
          className="inline-block px-6 py-3 rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors duration-300"
        >
          메타ID로 돌아가기(??)
        </Link>
      </motion.div>
    </div>
  )
}

