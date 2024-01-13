import type { NextPage } from "next";
import { useSession} from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useParams } from "next/navigation";
import { VscArrowLeft} from "react-icons/vsc";
import { Button } from "~/components/Button";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import { ProfileImage } from "~/components/ProfileImage";
import { api } from "~/utils/api";

const ProfilePage: NextPage = ()=>{
    const params = useParams<{id: string}>();
    const id = params?.id;
    
    const profile = api.profile.getById.useQuery({id}).data;
    const tweets = api.tweet.infiniteProfileFeed.useInfiniteQuery(
        { userId: id },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
      );

    const trpcUtils = api.useContext();
    const toggleFollow = api.profile.toggleFollow.useMutation({
        onSuccess: ({ addedFollow }) => {
        trpcUtils.profile.getById.setData({ id :id }, (oldData) => {
            if (oldData == null) return;

            const countModifier = addedFollow ? 1 : -1;
            return {
                ...oldData,
                isFollowing: addedFollow,
                followersCount: oldData.followersCount + countModifier,
            };
        });
        },
    });
    
    return (
        <>
            <Head>
                <title>{`Twitter Clone - ${profile?.name}`}</title>
            </Head>
            <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
                <Link href=".." className="mr-2">
                    <IconHoverEffect>
                        <VscArrowLeft className="h-6 w-6" />
                    </IconHoverEffect>
                </Link>
                <ProfileImage src={profile?.image} className="flex-shrink-0" />
                <div className="ml-2 flex-grow">
                <h1 className="text-lg font-bold">{profile?.name}</h1>
                <div className="text-gray-500">
                    {profile?.tweetsCount}{" "}
                    {getPlural(profile?.tweetsCount, "Tweet", "Tweets")} -{" "}
                    {profile?.followersCount}{" "}
                    {getPlural(profile?.followersCount, "Follower", "Followers")} -{" "}
                    {profile?.followsCount} Following
                </div>
                </div>
                <FollowButton
                    isFollowing={profile?.isFollowing}
                    isLoading={toggleFollow?.isLoading}
                    userId={id}
                    onClick={() => toggleFollow.mutate({ userId: params.id })}
                />
            </header>
            <main>
                <InfiniteTweetList
                tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
                isError={tweets.isError}
                isLoading={tweets.isLoading}
                hasMore={tweets.hasNextPage}
                fetchNewTweets={tweets.fetchNextPage}
                />
            </main>
        </>
    )
}

const pluralRules = new Intl.PluralRules();
function getPlural(number: number | undefined, singular: string, plural: string) {
    if(number == undefined) return singular;
  return pluralRules.select(number) === "one" ? singular : plural;
}

function FollowButton({
    userId,
    isFollowing,
    isLoading,
    onClick,
  }: {
    userId: string;
    isFollowing: boolean | undefined;
    isLoading: boolean;
    onClick: () => void;
  }) {
    const session = useSession();

    if(session.status !== "authenticated" || session.data.user.id === userId){
        return null;
    }
  
    return (
      <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
    );
  }

export default ProfilePage;