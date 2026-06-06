// import {  } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const ButtonUpgradeDemo = () => {
  return (
    <Link href="/dashboard">
      <Button size={'lg'} className='text-lg text-bg-foreground bg-transparent bg-gradient-to-r from-primary via-[#90FDF2] to-primary [background-size:200%_auto] hover:bg-transparent hover:bg-[99%_center] focus-visible:ring-primary/20 transition-all rounded-full'>
        Dapatkan Insight
      </Button>
    </Link>
  )
}

export default ButtonUpgradeDemo