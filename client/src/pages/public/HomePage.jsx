import HeroSection from '../../components/landing/home/HeroSection';
import CoinTickerMarquee from '../../components/landing/home/CoinTickerMarquee';
import StatsBar from '../../components/landing/home/StatsBar';
import WhyChooseUs from '../../components/landing/home/WhyChooseUs';
import HowItWorks from '../../components/landing/home/HowItWorks';
import TestimonialsSection from '../../components/landing/home/TestimonialsSection';
import SecurityAndContact from '../../components/landing/home/SecurityAndContact';

const HomePage = () => {
  return (
    <div className="relative">
      <HeroSection />
      <CoinTickerMarquee />
      <StatsBar />
      <WhyChooseUs />
      <HowItWorks />
      <TestimonialsSection />
      <SecurityAndContact />
    </div>
  );
};

export default HomePage;
