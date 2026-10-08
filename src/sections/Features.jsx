import { motion } from 'framer-motion'
import { Section } from '../components/Section'

const features = [
  ['📲', 'WhatsApp-first', 'Bill WhatsApp par aaye, Accept / Ask to change wahi se.'],
  ['✍️', 'Ask to change', 'Poora bill reject nahi — sirf galti highlight karo, credit note automatic.'],
  ['📩', 'Ask for bill', 'Maal aaya, bill nahi aaya? Ek tap mein seller se maango.'],
  ['🏛️', 'GST IMS sync', 'Accept / Reject / Pending seedha GST system tak (simulated in demo).'],
  ['📦', 'Stock check', 'Goods received confirm karo, inventory khud update.'],
  ['🧾', 'Returns ready', 'Month end par GSTR-1 / 2B reconciliation ready.'],
  ['💸', 'UPI payment', 'Invoice par UPI link, payment status live.'],
  ['⏱️', 'MSME 45-day tracker', 'Late payment alerts dono taraf.'],
  ['🗣️', 'Apni bhasha', 'Hindi, Marathi, Gujarati… + voice support.'],
  ['📶', 'Low internet friendly', 'Chhote shehron aur slow network ke liye halka design.'],
]

export default function Features() {
  return (
    <Section id="features" tone="ink" kicker="Built for Bharat 🇮🇳" title="India ke chhote aur medium businesses ke liye"
      lead="Bade ERP mehenge hain, simple billing apps mein GST workflow nahi hai. GIVA beech ki jagah bharta hai.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {features.map(([e, t, s], i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 5) * 0.08 }}
            whileHover={{ y: -4 }} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-3xl">{e}</div>
            <div className="mt-3 font-display font-bold">{t}</div>
            <div className="mt-1 text-sm text-white/65">{s}</div>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-sm text-white/50">Note: Real GST portal connection needs a registered GST Suvidha Provider (GSP). In this project, GST matching and sync are simulated with sample data.</p>
    </Section>
  )
}
