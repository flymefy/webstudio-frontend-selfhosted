import dynamic from '../../../../../../adapters/next-dynamic';
import AddBanner from '../../../components/add-banner/AddBanner';
import PopularDestinations from '../../../components/destinations/PopularDestinations';
import Footer3 from '../../../components/footer/footer-3';
import Header3 from '../../../components/header/header-3';
import Hero3 from '../../../components/hero/hero-3';
import BlockGuide from '../../../components/block/BlockGuide';
import Blog from '../../../components/blog/Blog3';
import CallToActions from '../../../components/common/CallToActions';
import Destinations from '../../../components/home/home-1/Destinations';
import Testimonial from '../../../components/home/home-1/Testimonial';
import TestimonialLeftCol from '../../../components/home/home-1/TestimonialLeftCol';
import Hotels from '../../../components/hotels/Hotels';
import SelectFilter from '../../../components/hotels/filter-tabs/SelectFilter';

const Home_1 = () => {
  return (
    <>
      {/* End Page Title */}

      <Header3 />
      {/* End Header 3 */}

      <Hero3 pageType="general" />
      {/* End Hero 3 */}

      <section className="layout-pt-lg layout-pb-md" data-aos="fade-up">
        <div className="container">
          <div className="row y-gap-20 justify-between items-end">
            <div className="col-auto">
              <div className="sectionTitle -md">
                <h2 className="sectionTitle__title">Popular Destinations</h2>
                <p className=" sectionTitle__text mt-5 sm:mt-0">
                  These popular destinations have a lot to offer
                </p>
              </div>
            </div>
            <div className="col-auto">
              <a href="/destinations" className="button -simple inline-flex items-center text-15 h-50 px-15 -dark-1">
                See all Destinations
                <i className="icon-arrow-top-right text-13 ml-10" />
              </a>
            </div>
          </div>
          {/* End .row */}

          <div className="row y-gap-30 pt-40">
            <PopularDestinations />
          </div>
          {/* End .row */}
        </div>
        {/* End .container */}
      </section>
      {/* End destinations Sections */}

      <section className="layout-pt-lg layout-pb-md">
        <div className="container">
          <div className="row justify-between items-end sectionTitle -md">
            <div className="col-auto">
              <h2 className="sectionTitle__title">Download the App</h2>
              <p className=" sectionTitle__text mt-5 sm:mt-0">
                Book and manage your trips anytime, anywhere
              </p>
            </div>
          </div>
          {/* End .row */}
          <div className="row y-gap-30 pt-40">
            <AddBanner />
          </div>
          {/* End .row */}
        </div>
        {/* End .container */}
      </section>
      {/* End AppBanner Section */}

      <section className="layout-pt-lg layout-pb-lg">
        <div className="container">
          <div className="row justify-center text-center">
            <div className="col-auto">
              <div className="sectionTitle -md">
                <h2 className="sectionTitle__title">Reviews</h2>
                <p className=" sectionTitle__text mt-5 sm:mt-0">
                  What our customers are saying
                </p>
              </div>
            </div>
          </div>
          {/* End .row */}

          <div className="row y-gap-30 pt-40">
            <div className="col-xl-10">
              <TestimonialLeftCol />
            </div>
            {/* End col-xl-7 */}
            <div className="col-xl-10">
              <Testimonial />
            </div>
          </div>
        </div>
      </section>
      {/* End testimonial Section */}

      <section className="layout-pt-lg layout-pb-lg">
        <div className="container">
          <div className="row justify-center text-center">
            <div className="col-auto">
              <div className="sectionTitle -md">
                <h2 className="sectionTitle__title">Hotels for You</h2>
                <p className=" sectionTitle__text mt-5 sm:mt-0">
                  Handpicked stays for your next trip
                </p>
              </div>
            </div>
          </div>
          {/* End .row */}

          <div className="row">
            <Hotels />
          </div>
        </div>
      </section>
      {/* End Hotels */}

      <CallToActions />
      {/* End Call To Actions Section */}

      <Footer3 />
      {/* End Footer Section */}
    </>
  );
};

export default Home_1;
