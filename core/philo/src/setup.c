/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   setup.c                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:27:38 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:24:23 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

void	assign_forks(t_philo *p, t_fork *forks, int philo_position)
{
	int	philo_nbr;

	philo_nbr = p->ptr->philo_nb;
	if (p->id % 2 == 0)
	{
		p->left_fork = &forks[philo_position];
		p->right_fork = &forks[(philo_position + 1) % philo_nbr];
	}
	else
	{
		p->left_fork = &forks[(philo_position + 1) % philo_nbr];
		p->right_fork = &forks[philo_position];
	}
}

void	setup(t_data *ptr)
{
	int	i;

	i = 0;
	ptr->philos = safe_malloc(sizeof(t_philo) * ptr->philo_nb);
	safe_mutex_handle(&ptr->table_mutex, INIT);
	safe_mutex_handle(&ptr->write_mutex, INIT);
	ptr->forks = safe_malloc(sizeof(t_fork) * ptr->philo_nb);
	while (i < ptr->philo_nb)
	{
		safe_mutex_handle(&ptr->forks[i].fork, INIT);
		ptr->forks[i].fork_id = i;
		i++;
	}
	philo_init(ptr);
}
