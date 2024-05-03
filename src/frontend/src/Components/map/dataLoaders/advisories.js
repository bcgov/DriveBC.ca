import { getAdvisories } from '../../data/advisories';
import * as slices from '../../../slices';

export const loadAdvisories = async (advisories, dispatch, displayError) => {
  // Fetch data if it doesn't already exist
  if (!advisories) {
    dispatch(
      slices.updateAdvisories({
        list: await getAdvisories().catch((error) => displayError(error)),
        timeStamp: new Date().getTime(),
      }),
    );
  }
};
