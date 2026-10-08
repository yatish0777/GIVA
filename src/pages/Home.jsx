import Nav from '../sections/Nav'
import Hero from '../sections/Hero'
import Problem from '../sections/Problem'
import HowItWorks from '../sections/HowItWorks'
import Demo from '../sections/Demo'
import MainIdea from '../sections/MainIdea'
import Features from '../sections/Features'
import Contact from '../sections/Contact'
import Footer from '../sections/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Demo />
        <MainIdea />
        <Features />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
