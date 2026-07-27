import { useEffect } from 'react';
import Pagination from '../../../../components/common/Pagination';
import ImageGallery from '../../../../components/common/ImageGallery';
import EmptyState from '../../../../components/common/EmptyState';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { Image } from 'lucide-react';

const PaymentScreenshotsTab = ({ data, loading, onLoad }) => {
  useEffect(() => {
    onLoad('screenshots');
  }, [onLoad]);

  if (loading) return <LoadingSpinner />;
  if (!data?.screenshots?.length) return <EmptyState icon={Image} title="No screenshots" description="This user hasn't uploaded any payment screenshots." />;

  return (
    <div>
      <ImageGallery images={data.screenshots} />
      <Pagination page={data.page} total={data.total} limit={data.limit} onPageChange={(p) => onLoad('screenshots', p)} />
    </div>
  );
};

export default PaymentScreenshotsTab;
