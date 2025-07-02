/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   time.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/29 16:21:35 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:21:54 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

long	gettime(t_timecode time_code)
{
	struct timeval	tv;

	if (gettimeofday(&tv, NULL) != 0)
		error_exit("gettimeofday failed");
	if (time_code == SECONDS)
		return (tv.tv_sec + (tv.tv_usec / 1000000));
	else if (time_code == MILLISECONDS)
		return ((tv.tv_sec * 1000) + (tv.tv_usec / 1000));
	else if (time_code == MICROSECONDS)
		return (tv.tv_sec * 1000000 + tv.tv_usec);
	else
		error_exit("wrong input for gettime");
	return (987654321);
}

void	precise_usleep(long usec, t_data *ptr)
{
	long	start;
	long	elapsed;
	long	now;
	long	remaining;

	start = gettime(MICROSECONDS);
	while (1)
	{
		if (simulation_finished(ptr))
			break ;
		now = gettime(MICROSECONDS);
		elapsed = now - start;
		if (elapsed >= usec)
			break ;
		remaining = usec - elapsed;
		if (remaining > 1000)
			usleep(remaining / 2);
		else
			usleep(0);
	}
}
